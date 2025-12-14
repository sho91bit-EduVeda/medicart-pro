import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash, CheckCircle, Clock } from "lucide-react";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    status: 'read' | 'unread';
}

export const ContactMessages = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'contact_messages'),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const messagesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ContactMessage[];

            setMessages(messagesData);
        } catch (error) {
            console.error("Failed to fetch contact messages:", error);
            toast.error("Failed to load contact messages");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (messageId: string) => {
        try {
            const messageRef = doc(db, 'contact_messages', messageId);
            await updateDoc(messageRef, {
                status: 'read'
            });

            toast.success("Message marked as read");
            fetchMessages();
        } catch (error) {
            console.error("Failed to mark message as read:", error);
            toast.error("Failed to update message status");
        }
    };

    const handleDelete = async (messageId: string) => {
        try {
            await deleteDoc(doc(db, 'contact_messages', messageId));
            toast.success("Message deleted successfully");
            fetchMessages();
            if (selectedMessage?.id === messageId) {
                setSelectedMessage(null);
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
            toast.error("Failed to delete message");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const unreadCount = messages.filter(m => m.status === 'unread').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Contact Messages</h2>
                    <p className="text-muted-foreground">
                        {messages.length} total messages, {unreadCount} unread
                    </p>
                </div>
                <Button onClick={fetchMessages} variant="outline">
                    Refresh
                </Button>
            </div>

            {/* Messages Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Messages List */}
                <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
                    {messages.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">No messages yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        messages.map((message) => (
                            <motion.div
                                key={message.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card
                                    className={`cursor-pointer transition-all ${selectedMessage?.id === message.id
                                            ? 'border-primary shadow-md'
                                            : 'hover:shadow-sm'
                                        } ${message.status === 'unread' ? 'bg-blue-50/50 border-blue-200' : ''}`}
                                    onClick={() => {
                                        setSelectedMessage(message);
                                        if (message.status === 'unread') {
                                            handleMarkAsRead(message.id);
                                        }
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm truncate">{message.name}</h3>
                                                <p className="text-xs text-muted-foreground truncate">{message.email}</p>
                                            </div>
                                            {message.status === 'unread' && (
                                                <Badge variant="default" className="ml-2">New</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium truncate mb-1">{message.subject}</p>
                                        <p className="text-xs text-muted-foreground truncate">{message.message}</p>
                                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(message.created_at)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Message Detail */}
                <div className="lg:col-span-2">
                    {selectedMessage ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {selectedMessage.subject}
                                            {selectedMessage.status === 'unread' && (
                                                <Badge variant="default">New</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            From: {selectedMessage.name} ({selectedMessage.email})
                                        </CardDescription>
                                        <CardDescription>
                                            Received: {formatDate(selectedMessage.created_at)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedMessage.status === 'unread' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleMarkAsRead(selectedMessage.id)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Mark Read
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(selectedMessage.id)}
                                        >
                                            <Trash className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted/50 rounded-lg p-6">
                                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-6 flex gap-4">
                                    <Button
                                        variant="default"
                                        onClick={() => {
                                            window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`;
                                        }}
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Reply via Email
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            window.location.href = `tel:079053 82771`;
                                        }}
                                    >
                                        Call Customer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-full">
                            <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                                <div className="text-center">
                                    <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">Select a message to view details</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
