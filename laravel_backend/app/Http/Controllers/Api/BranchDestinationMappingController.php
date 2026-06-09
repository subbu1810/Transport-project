<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BranchDestinationMapping;
use App\Models\Destination;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BranchDestinationMappingController extends Controller
{
    /**
     * Get mappings for a specific branch and taluk.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $branchId = $request->query('branch_id');
            $talukId = $request->query('taluk_id');

            if (!$branchId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Branch ID is required',
                ], 400);
            }

            // Get all destinations (filtered by taluk if provided)
            $query = Destination::with('taluk.district')
                ->where('is_active', true);
            
            if ($talukId) {
                $query->where('taluk_id', $talukId);
            }

            $allDestinations = $query->get();

            // Get assigned destination IDs for this branch
            $assignedIdsQuery = BranchDestinationMapping::where('branch_id', $branchId);
            
            $assignedIds = $assignedIdsQuery->pluck('destination_id')->toArray();

            $assigned = [];
            $unassigned = [];

            foreach ($allDestinations as $dest) {
                if (in_array($dest->id, $assignedIds)) {
                    $assigned[] = $dest;
                } else {
                    $unassigned[] = $dest;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'assigned' => $assigned,
                    'unassigned' => $unassigned,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Save mappings for a branch.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'branch_id' => 'required|exists:branches,id',
                'taluk_id' => 'required|exists:taluks,id',
                'destination_ids' => 'present|array',
            ]);

            $branchId = $validated['branch_id'];
            $talukId = $validated['taluk_id'];
            $newDestinationIds = $validated['destination_ids'];

            // Get all destinations in this taluk to know which ones we are "managing" in this call
            $talukDestinationIds = Destination::where('taluk_id', $talukId)
                ->pluck('id')
                ->toArray();

            // Perform delete and insert in a single transaction
            \Illuminate\Support\Facades\DB::transaction(function () use ($branchId, $talukDestinationIds, $newDestinationIds) {
                // Delete existing mappings for this branch in this specific taluk
                BranchDestinationMapping::where('branch_id', $branchId)
                    ->whereIn('destination_id', $talukDestinationIds)
                    ->delete();

                // Create new mappings
                $mappings = [];
                foreach ($newDestinationIds as $destId) {
                    $mappings[] = [
                        'branch_id' => $branchId,
                        'destination_id' => $destId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                if (!empty($mappings)) {
                    BranchDestinationMapping::insert($mappings);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Mappings saved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get only assigned destinations for a branch.
     */
    public function getAssignedByBranch(int $branchId): JsonResponse
    {
        try {
            $destinations = Destination::whereHas('branchMappings', function($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            })
            ->where('is_active', true)
            ->with('taluk.district')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $destinations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
