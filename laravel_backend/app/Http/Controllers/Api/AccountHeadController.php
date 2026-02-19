<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountHead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccountHeadController extends Controller
{
    public function index()
    {
        $heads = AccountHead::all();
        return response()->json([
            'success' => true,
            'data' => $heads
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'transaction_type' => 'required|in:CREDIT,DEBIT',
            'status' => 'required|in:Active,Inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()
            ], 400);
        }

        $head = AccountHead::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Account head created successfully',
            'data' => $head
        ], 201);
    }

    public function show($id)
    {
        $head = AccountHead::find($id);

        if (!$head) {
            return response()->json([
                'success' => false,
                'message' => 'Account head not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $head
        ]);
    }

    public function update(Request $request, $id)
    {
        $head = AccountHead::find($id);

        if (!$head) {
            return response()->json([
                'success' => false,
                'message' => 'Account head not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'transaction_type' => 'sometimes|required|in:CREDIT,DEBIT',
            'status' => 'sometimes|required|in:Active,Inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()
            ], 400);
        }

        $head->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Account head updated successfully',
            'data' => $head
        ]);
    }

    public function destroy($id)
    {
        $head = AccountHead::find($id);

        if (!$head) {
            return response()->json([
                'success' => false,
                'message' => 'Account head not found'
            ], 404);
        }

        $head->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account head deleted successfully'
        ]);
    }
}
