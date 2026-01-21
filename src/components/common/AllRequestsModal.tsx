import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { db } from '@/integrations/firebase/config';
import { collection, query, onSnapshot, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RequestDetailsModal from './RequestDetailsModal';

interface AllRequestsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AllRequestsModal: React.FC<AllRequestsModalProps> = ({ open, onOpenChange }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const { user } = useAuth();

    // For RequestDetailsModal
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        if (!user || !open) return;

        setLoading(true);

        const q = query(
            collection(db, "medicine_requests"),
            orderBy("created_at", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allRequests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(allRequests);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching requests:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, open]);

    // Filter requests locally
    useEffect(() => {
        let result = requests;

        if (statusFilter !== 'all') {
            result = result.filter(req => req.status === statusFilter);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(req =>
                req.customer_name?.toLowerCase().includes(lowerTerm) ||
                req.medicine_name?.toLowerCase().includes(lowerTerm) ||
                req.email?.toLowerCase().includes(lowerTerm)
            );
        }

        setFilteredRequests(result);
    }, [requests, searchTerm, statusFilter]);

    const handleRequestClick = async (request: any) => {
        // If pending, mark as in progress
        if (request.status === 'pending') {
            try {
                const requestRef = doc(db, 'medicine_requests', request.id);
                await updateDoc(requestRef, {
                    status: 'in_progress',
                    updated_at: new Date().toISOString()
                });
                // Update local state immediately for better UX
                setSelectedRequest({
                    ...request,
                    status: 'in_progress'
                });
            } catch (error) {
                console.error("Error updating status", error);
                setSelectedRequest(request);
            }
        } else {
            setSelectedRequest(request);
        }

        setIsDetailsOpen(true);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[900px] h-full overflow-y-auto flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl">
                    {/* Header with Gradient */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <DialogHeader className="relative z-10 flex flex-row items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                                    <span className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    </span>
                                    Medicine Requests
                                </DialogTitle>
                                <DialogDescription className="text-blue-100 mt-1">
                                    Manage all incoming medicine requests
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b bg-white flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, medicine or email..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    <SelectValue placeholder="Filter by status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Requests</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredRequests.length > 0 ? (
                            <div className="space-y-3">
                                {filteredRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex justify-between items-center group"
                                        onClick={() => handleRequestClick(req)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${req.status === 'pending' ? 'bg-yellow-500' :
                                                    req.status === 'in_progress' ? 'bg-blue-500' : 'bg-green-500'
                                                }`} />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{req.medicine_name}</h4>
                                                <p className="text-sm text-slate-600">Requested by <span className="font-medium">{req.customer_name}</span></p>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Unknown'}
                                                    </span>
                                                    <span>#{req.id.slice(0, 8)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {req.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Search className="w-12 h-12 mb-2 opacity-20" />
                                <p>No requests found matching your filters</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {selectedRequest && (
                <RequestDetailsModal
                    request={selectedRequest}
                    open={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                    onUpdate={() => {
                        // The main list updates automatically via snapshot
                    }}
                />
            )}
        </>
    );
};

export default AllRequestsModal;
