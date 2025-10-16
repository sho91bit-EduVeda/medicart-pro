import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

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
  const { isAuthenticated } = useAuth();
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
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to leave a review');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('product_reviews')
        .insert([{
          product_id: productId,
          user_id: user.id,
          rating,
          title,
          comment,
        }]);

      if (error) throw error;

      toast.success('Review submitted successfully');
      setShowForm(false);
      setTitle("");
      setComment("");
      setRating(5);
      loadReviews();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You have already reviewed this product');
      } else {
        toast.error('Failed to submit review');
      }
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
                  className={`w-5 h-5 ${
                    star <= averageRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">{reviews.length} reviews</div>
          </div>

          <Separator orientation="vertical" className="h-20" />

          <Button onClick={() => setShowForm(!showForm)} disabled={!isAuthenticated}>
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
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    {review.verified_purchase && (
                      <Badge variant="secondary" className="text-xs">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>

                {review.title && (
                  <h4 className="font-semibold mb-2">{review.title}</h4>
                )}

                {review.comment && (
                  <p className="text-muted-foreground mb-3">{review.comment}</p>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Button variant="ghost" size="sm" className="h-8">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Helpful ({review.helpful_count})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
