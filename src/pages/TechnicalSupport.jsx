import React from 'react';
import { Mail, Phone, MapPin, Headphones, Globe, Shield } from 'lucide-react';

const TechnicalSupport = () => {
    const supportContacts = [
        { name: 'Support Line 1', phone: '7022477479' },
        { name: 'Support Line 2', phone: '7676814367' },
        { name: 'Support Line 3', phone: '9980190691' }
    ];

    return (
        <div className="min-h-full bg-slate-50 p-6 md:p-10">
            <div className="w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                                <Headphones size={24} className="text-white" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Technical Support</h1>
                        </div>
                        <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
                            Need help with your transport management system? Our dedicated team is here to assist you with any technical issues or implementation queries.
                        </p>
                    </div>
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -trblue-y-12 trblue-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 trblue-y-12 -trblue-x-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Office Address Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <MapPin size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Our Office</h2>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-blue-700 uppercase tracking-wider">S SQUARE G TECH SOLUTIONS PVT LTD.</h3>
                            <div className="space-y-2 text-slate-600 leading-relaxed font-medium">
                                <p>Near Anikethana Degree College,</p>
                                <p>Adarsh colony, Sindhanur,</p>
                                <p>Raichur, Karnataka 584128</p>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-50 flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Globe size={16} />
                                    <span className="text-xs font-semibold tracking-widest uppercase">Raichur • Karnataka • India</span>
                                </div>
                                <a href="https://ssquareg.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors w-fit">
                                    <Globe size={16} />
                                    <span className="text-sm font-bold">ssquareg.com</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Details Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                                <Phone size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Contact Channels</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-3">
                                {supportContacts.map((contact, idx) => (
                                    <a
                                        key={idx}
                                        href={`tel:${contact.phone}`}
                                        className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-green-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-green-100"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">{contact.name}</span>
                                            <span className="text-lg font-black text-slate-700 group-hover:text-green-700 transition-colors tracking-tight">
                                                +91 {contact.phone}
                                            </span>
                                        </div>
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-green-600 group-hover:scale-110 transition-all">
                                            <Phone size={18} />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust Section */}
                <div className="bg-slate-900 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center">
                                    <Shield size={16} className="text-slate-400" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-white font-bold">24/7 Monitoring</p>
                            <p className="text-slate-400 text-xs">System health & security</p>
                        </div>
                    </div>
                    <div className="h-px w-full md:w-px md:h-8 bg-slate-800"></div>
                    <div className="text-center md:text-right">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Response Time</p>
                        <p className="text-green-400 font-black">Under 2 Hours</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicalSupport;
