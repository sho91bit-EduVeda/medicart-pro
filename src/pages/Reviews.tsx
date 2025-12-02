import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreReviews from "@/components/StoreReviews";
import StoreReviewForm from "@/components/StoreReviewForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Reviews = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground hover:bg-white/20 rounded-full"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Store Reviews</h1>
                <p className="text-sm text-primary-foreground/90">Share your experience with us</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Leave a Review</CardTitle>
              <CardDescription>
                Share your experience with our store to help us improve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StoreReviewForm 
                onClose={() => {}} 
                onSubmit={() => {}} 
              />
            </CardContent>
          </Card>

          <StoreReviews />
        </div>
      </main>
    </div>
  );
};

export default Reviews;