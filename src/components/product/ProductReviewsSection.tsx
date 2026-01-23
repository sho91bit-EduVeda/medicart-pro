import { useState, useEffect } from "react";
import { auth, db } from "@/integrations/firebase/config";
import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  user_id: string;
}

interface ProductReviewsSectionProps {
  productId: string;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  const { productReviews } = useFeatureFlags();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productReviews) {
      loadReviews();
    }
  }, [productId, productReviews]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'product_reviews'),
        where('product_id', '==', productId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];

      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      
      // Check if authenticated user already reviewed this product
      if (user) {
        const q = query(
          collection(db, 'product_reviews'),
          where('product_id', '==', productId),
          where('user_id', '==', user.uid)
        );
        const existingReviews = await getDocs(q);

        if (!existingReviews.empty) {
          toast.error('You have already reviewed this product');
          setSubmitting(false);
          return;
        }
      }

      // Create review document - for anonymous users, we won't store user_id
      const reviewData: any = {
        product_id: productId,
        rating,
        title,
        comment,
        verified_purchase: false, // Logic to check verification can be added later
        helpful_count: 0,
        created_at: new Date().toISOString()
      };

      // Only add user_id if user is authenticated
      if (user) {
        reviewData.user_id = user.uid;
      }

      await addDoc(collection(db, 'product_reviews'), reviewData);

      toast.success('Review submitted successfully');
      setShowForm(false);
      setTitle("");
      setComment("");
      setRating(5);
      loadReviews();
    } catch (error: any) {
      toast.error('Failed to submit review');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!productReviews) return null;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-4">Customer Reviews</h3>

        <div className="flex items-center gap-4 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= averageRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                    }`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">{reviews.length} reviews</div>
          </div>

          <Separator orientation="vertical" className="h-20" />

          <Button onClick={() => setShowForm(!showForm)}>
            Write a Review
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 cursor-pointer transition-colors ${star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
                        }`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Review Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Review</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={submitReview} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {review.user_id ? "Verified Customer" : "Anonymous User"}
                      </span>
                      {review.verified_purchase && (
                        <Badge variant="secondary">Verified Purchase</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                {review.title && (
                  <h4 className="font-semibold mb-2">{review.title}</h4>
                )}
                
                {review.comment && (
                  <p className="text-muted-foreground">{review.comment}</p>
                )}
                
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpful_count})
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}