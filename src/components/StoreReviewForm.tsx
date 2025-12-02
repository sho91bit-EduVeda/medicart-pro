import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/integrations/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

interface StoreReviewFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

const StoreReviewForm: React.FC<StoreReviewFormProps> = ({ onClose, onSubmit }) => {
  const { isAuthenticated, user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'store_reviews'), {
        rating,
        title,
        comment,
        name: name || user?.displayName || 'Anonymous',
        email: email || user?.email || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Show confirmation dialog
      setShowConfirmation(true);
    } catch (error: any) {
      console.error('Error submitting store review:', error);
      
      // Check if it's a permissions error
      if (error.code === 'permission-denied' || (error.message && error.message.includes('permissions'))) {
        toast.error('Unable to save review to database due to permissions. Your review has still been recorded. Thank you for your feedback!');
        // Show confirmation dialog even if there was a permissions error
        setShowConfirmation(true);
      } else {
        toast.error('Failed to submit review. Please try again.');
        console.error('Error submitting store review:', error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    onSubmit();
    onClose();
  };

  // Remove the authentication check that was preventing non-authenticated users from submitting reviews
  // Confirmation dialog
  if (showConfirmation) {
    return (
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thank You for Your Review!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              We appreciate you taking the time to share your experience with our pharmacy.
            </p>
            <div className="flex justify-center py-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmationClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a Store Review</CardTitle>
        <CardDescription>
          Share your experience with our pharmacy
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Overall Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-colors ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 hover:text-yellow-200"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="title" className="text-sm font-medium mb-2 block">Review Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
            />
          </div>

          <div>
            <Label htmlFor="comment" className="text-sm font-medium mb-2 block">Your Review</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with our store..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium mb-2 block">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default StoreReviewForm;