import { useState } from "react"
import { useFeatureFlags } from "../hooks/useFeatureFlags"
import { Card } from "./ui/card"
import { StarIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { cn } from "../lib/utils"

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

interface ProductReviewsProps {
  productId: string
  reviews: Review[]
  onAddReview: (review: Omit<Review, "id" | "createdAt">) => void
}

export function ProductReviews({
  productId,
  reviews,
  onAddReview,
}: ProductReviewsProps) {
  const { reviews: reviewsEnabled } = useFeatureFlags()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [hoverRating, setHoverRating] = useState(0)

  if (!reviewsEnabled) return null

  const handleSubmitReview = () => {
    if (rating === 0) return

    onAddReview({
      userId: "current-user-id", // Replace with actual user ID
      userName: "John Doe", // Replace with actual user name
      rating,
      comment,
    })

    // Reset form
    setRating(0)
    setComment("")
  }

  const averageRating =
    reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={cn(
                  "w-5 h-5",
                  star <= averageRating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
          </span>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Write a Review</h4>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <StarIcon
                className={cn(
                  "w-6 h-6",
                  star <= (hoverRating || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                )}
              />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your review here..."
          className="mb-4"
        />
        <Button onClick={handleSubmitReview} disabled={rating === 0}>
          Submit Review
        </Button>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-t pt-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{review.userName}</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= review.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-600">{review.comment}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}