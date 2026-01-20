import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Heart,
  Star,
  Phone,
  PackagePlus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { db } from "@/integrations/firebase/config";
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import RequestMedicineSheet from "@/components/common/RequestMedicineSheet";
import { auth } from "@/integrations/firebase/config";

interface Product {
  id: string;
  name: string;
  description?: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
  category_id?: string;
  categories?: {
    name: string;
  };
  uses?: string;
  side_effects?: string;
  composition?: string;
  stock_quantity?: number;
}

interface SearchPopupProps {
  searchQuery: string;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'details' | 'reviews';
  showBackButton?: boolean; // Add this new prop
}

export function SearchPopup({
  searchQuery,
  isOpen,
  onClose,
  initialTab = 'details',
  showBackButton = true // Default to true to maintain existing behavior
}: SearchPopupProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { deliveryEnabled } = useFeatureFlags(); // Add this line

  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  // When the popup opens or initialTab changes, update the active tab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && searchQuery) {
      searchProducts();
      fetchDiscount();
    }
  }, [isOpen, searchQuery]);

  const fetchDiscount = async () => {
    try {
      const settingsRef = doc(db, "settings", "store");
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        setDiscountPercentage(settingsSnap.data().discount_percentage || 0);
      }
    } catch (error) {
      console.error("Failed to load discount settings:", error);
    }
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // First try prefix search
      let q = query(
        collection(db, "products"),
        where("name", ">=", searchQuery),
        where("name", "<=", searchQuery + "\uf8ff"),
        limit(20)
      );

      let querySnapshot = await getDocs(q);
      let productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];

      // If no results found with prefix search, try a broader search
      if (productsData.length === 0) {
        // Get all products and filter client-side (less efficient but more flexible)
        const allProductsSnapshot = await getDocs(collection(db, "products"));
        const allProducts = allProductsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        })) as Product[];

        // Filter products that contain the search query
        productsData = allProducts.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Sort by relevance
        productsData.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const search = searchQuery.toLowerCase();

          // Exact matches first
          if (aName === search) return -1;
          if (bName === search) return 1;

          // Starts with search term
          if (aName.startsWith(search)) return -1;
          if (bName.startsWith(search)) return 1;

          // Contains search term
          if (aName.includes(search)) return -1;
          if (bName.includes(search)) return 1;

          return 0;
        });

        // Limit to 20 results
        productsData = productsData.slice(0, 20);
      }

      setProducts(productsData);

      // If only one product found, select it automatically
      if (productsData.length === 1) {
        setSelectedProduct(productsData[0]);
      }
    } catch (error) {
      console.error("Failed to search products:", error);
      toast.error("Failed to search products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product.id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error("Failed to add product to cart");
    }
  };

  const handleWishlistToggle = async (product: Product) => {
    try {
      await toggleItem(product.id);
      const isNowWishlisted = !isInWishlist(product.id);
      toast.success(
        isNowWishlisted
          ? `${product.name} added to wishlist!`
          : `${product.name} removed from wishlist!`
      );
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleViewDetails = async (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('details');
    // Load reviews when viewing product details
    loadReviews(product.id);
  };

  const loadReviews = async (productId: string) => {
    setReviewsLoading(true);
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
      }));

      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to leave a review');
      return;
    }

    if (!selectedProduct) return;

    setSubmittingReview(true);
    try {
      // Check if user already reviewed
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const q = query(
        collection(db, 'product_reviews'),
        where('product_id', '==', selectedProduct.id),
        where('user_id', '==', user.uid)
      );
      const existingReviews = await getDocs(q);

      if (!existingReviews.empty) {
        toast.error('You have already reviewed this product');
        setSubmittingReview(false);
        return;
      }

      await addDoc(collection(db, 'product_reviews'), {
        product_id: selectedProduct.id,
        user_id: user.uid,
        rating,
        title,
        comment,
        verified_purchase: false, // Logic to check verification can be added later
        helpful_count: 0,
        created_at: new Date().toISOString()
      });

      toast.success('Review submitted successfully');
      setTitle("");
      setComment("");
      setRating(5);
      loadReviews(selectedProduct.id);
    } catch (error: any) {
      toast.error('Failed to submit review');
      console.error(error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
    // Reset the search to show all results again
    searchProducts();
  };

  // If a product is selected, show its details
  if (selectedProduct) {
    const discountedPrice = selectedProduct.original_price * (1 - discountPercentage / 100);
    const savings = selectedProduct.original_price - discountedPrice;
    const isWishlisted = isInWishlist(selectedProduct.id);

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 border-none shadow-2xl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-xl md:text-2xl font-bold text-white truncate pr-10">
                {selectedProduct.name}
              </DialogTitle>
              <div className="flex justify-between items-center mt-2">
                {showBackButton && (
                  <Button
                    variant="ghost"
                    onClick={handleBackToList}
                    className="text-sm h-9 px-4 text-white hover:bg-white/20 border border-white/20"
                  >
                    ← Back to Results
                  </Button>
                )}
                <div className="flex-1"></div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 relative">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              opacity: 0.3
            }}></div>

            <div className="grid md:grid-cols-2 gap-6 p-6 relative z-10">
              {/* Product Image */}
              <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center p-4">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain max-h-[200px] md:max-h-[400px] max-w-[200px] md:max-w-none mx-auto"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-8 rounded-lg">
                    <span className="text-6xl md:text-9xl">💊</span>
                  </div>
                )}
              </div>

              {/* Product Info and Reviews */}
              <div className="space-y-4 overflow-y-auto max-h-[70vh] md:max-h-none bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div>
                  {selectedProduct.categories && (
                    <Badge variant="secondary" className="mb-2 text-xs px-2 py-0.5">
                      {selectedProduct.categories.name}
                    </Badge>
                  )}
                  <h2 className="text-lg md:text-2xl font-bold mb-2">{selectedProduct.name}</h2>
                  {!selectedProduct.in_stock && (
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="border-b">
                  <nav className="flex space-x-4">
                    <button
                      className={`pb-2 px-1 font-medium text-xs md:text-sm ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                      onClick={() => setActiveTab('details')}
                    >
                      Product Details
                    </button>
                    <button
                      className={`pb-2 px-1 font-medium text-xs md:text-sm ${activeTab === 'reviews' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                      onClick={() => setActiveTab('reviews')}
                    >
                      Reviews ({reviews.length})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'details' ? (
                  <div className="space-y-3">
                    {/* Product Details */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 md:max-h-[300px]">
                      {selectedProduct.description && (
                        <div>
                          <h3 className="text-base md:text-lg font-semibold mb-1">Description</h3>
                          <p className="text-muted-foreground text-sm md:text-base">{selectedProduct.description}</p>
                        </div>
                      )}

                      {selectedProduct.uses && (
                        <div>
                          <h3 className="text-base md:text-lg font-semibold mb-1">Uses</h3>
                          <p className="text-muted-foreground text-sm md:text-base">{selectedProduct.uses}</p>
                        </div>
                      )}

                      {selectedProduct.composition && (
                        <div>
                          <h3 className="text-base md:text-lg font-semibold mb-1">Composition</h3>
                          <p className="text-muted-foreground text-sm md:text-base">{selectedProduct.composition}</p>
                        </div>
                      )}

                      {selectedProduct.side_effects && (
                        <div>
                          <h3 className="text-base md:text-lg font-semibold mb-1">Side Effects</h3>
                          <p className="text-muted-foreground text-sm md:text-base">{selectedProduct.side_effects}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <h4 className="font-medium text-xs md:text-sm text-muted-foreground">Availability</h4>
                          <p className={`font-medium text-sm md:text-base ${selectedProduct.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedProduct.in_stock ? 'In Stock' : 'Out of Stock'}
                          </p>
                        </div>
                        {selectedProduct.stock_quantity !== undefined && selectedProduct.stock_quantity > 0 && (
                          <div>
                            <h4 className="font-medium text-xs md:text-sm text-muted-foreground">Stock Quantity</h4>
                            <p className="font-medium text-sm md:text-base">{selectedProduct.stock_quantity} units</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="p-3 bg-card rounded-lg">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-lg md:text-2xl font-bold text-primary">
                          ₹{discountedPrice.toFixed(2)}
                        </span>
                        {discountPercentage > 0 && (
                          <span className="text-sm md:text-base text-muted-foreground line-through">
                            ₹{selectedProduct.original_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {discountPercentage > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-destructive text-destructive-foreground text-xs">
                            {discountPercentage}% OFF
                          </Badge>
                          <span className="text-secondary font-semibold text-xs">
                            You save ₹{savings.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5 mt-3">
                        {/* Request Availability button should only show for out-of-stock products */}
                        {!selectedProduct.in_stock && (
                          <RequestMedicineSheet medicineName={selectedProduct.name}>
                            <Button 
                              className="w-full h-8 text-sm" 
                              size="sm"
                              onClick={(e) => {
                                // Prevent event from bubbling up to parent components
                                e.stopPropagation();
                              }}
                            >
                              <PackagePlus className="w-3 h-3 mr-2" />
                              Request Availability                            </Button>
                          </RequestMedicineSheet>
                        )}
                        {/* Add to Cart button should only show for in-stock products and when delivery is enabled */}
                        {selectedProduct.in_stock && deliveryEnabled && (
                          <Button
                            className="w-full h-8 text-sm"
                            size="sm"
                            onClick={() => handleAddToCart(selectedProduct)}
                          >
                            <ShoppingCart className="w-3 h-3 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Contact Info - REMOVED FOR MOBILE VIEW */}
                    {/* <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Contact Us</p>
                          <p className="text-sm text-muted-foreground">+91 98765 43210</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        Have questions about this medicine? Call us for expert advice.
                      </p>
                    </CardContent>
                  </Card> */}
                  </div>
                ) : (
                  /* Reviews Tab */
                  <div className="space-y-4">
                    {/* Average Rating */}
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold">{averageRating.toFixed(1)}</div>
                        <div className="flex items-center justify-center gap-1 my-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 md:w-4 md:h-4 ${star <= averageRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">{reviews.length} reviews</div>
                      </div>
                    </div>

                    {/* Review Form */}
                    {isAuthenticated ? (
                      <Card>
                        <CardContent className="p-3 md:p-4 space-y-3">
                          <h4 className="font-medium text-sm md:text-base">Write a Review</h4>
                          <div>
                            <label className="text-xs md:text-sm font-medium mb-1 block">Rating</label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-5 h-5 md:w-6 md:h-6 cursor-pointer transition-colors ${star <= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300 hover:text-yellow-200"
                                    }`}
                                  onClick={() => setRating(star)}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-xs md:text-sm font-medium mb-1 block">Review Title</label>
                            <Input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Summarize your experience"
                              className="text-sm"
                            />
                          </div>

                          <div>
                            <label className="text-xs md:text-sm font-medium mb-1 block">Review</label>
                            <Textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Share your thoughts about this product"
                              rows={2}
                              className="text-sm"
                            />
                          </div>

                          <Button onClick={submitReview} disabled={submittingReview} size="sm" className="text-sm h-8">
                            {submittingReview ? "Submitting..." : "Submit Review"}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="p-3 md:p-4 text-center">
                          <p className="text-muted-foreground text-sm">Please sign in to leave a review</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 md:max-h-[300px]">
                      {reviewsLoading ? (
                        <div className="text-center py-3 md:py-4 text-sm">Loading reviews...</div>
                      ) : reviews.length === 0 ? (
                        <div className="text-center py-3 md:py-4 text-muted-foreground text-sm">
                          No reviews yet. Be the first to review this product!
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="p-3 md:p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-1 md:gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 md:w-4 md:h-4 ${star <= review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                        }`}
                                    />
                                  ))}
                                  {review.verified_purchase && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                      Verified Purchase
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs md:text-sm text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              {review.title && (
                                <h4 className="font-semibold mb-1 text-sm">{review.title}</h4>
                              )}

                              {review.comment && (
                                <p className="text-muted-foreground text-xs md:text-sm">{review.comment}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show product list
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0 border-none shadow-2xl">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold text-white">Search Results for "{searchQuery}"</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 relative p-6">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            opacity: 0.3
          }}></div>

          <div className="relative z-10">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 font-medium">No products found matching "{searchQuery}"</p>
                <p className="text-sm text-slate-500 mt-2">
                  Try different keywords or check back later.
                </p>

                {/* Contact Info */}
                <Card className="mt-6 bg-white border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Can't find what you're looking for?</h3>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Contact Us</p>
                        <p className="text-sm text-slate-600">+91 98765 43210</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-3">
                      Our pharmacists can help you find the right medicine.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 font-medium">
                  Found {products.length} product{products.length !== 1 ? 's' : ''} matching "{searchQuery}"
                </p>

                <div className="grid gap-4">
                  {products.map((product) => {
                    const discountedPrice = product.original_price * (1 - discountPercentage / 100);
                    const isWishlisted = isInWishlist(product.id);

                    return (
                      <Card key={product.id} className="hover:shadow-md transition-all bg-white border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-md md:w-16 md:h-16"
                              />
                            ) : (
                              <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md md:w-16 md:h-16">
                                <span className="text-2xl">💊</span>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate text-slate-900">{product.name}</h3>
                              <p className="text-blue-600 font-medium">₹{discountedPrice.toFixed(2)}</p>
                              {!product.in_stock && (
                                <Badge variant="destructive" className="mt-1">Out of Stock</Badge>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button size="sm" onClick={() => handleViewDetails(product)} className="bg-blue-600 hover:bg-blue-700">
                                View Details
                              </Button>
                              {/* Request Availability button should only show for out-of-stock products */}
                              {!product.in_stock && (
                                <RequestMedicineSheet medicineName={product.name}>
                                  <Button
                                    onClick={(e) => {
                                      // Prevent event from bubbling up to parent components
                                      e.stopPropagation();
                                    }}
                                  >
                                    <PackagePlus className="w-4 h-4" />
                                  </Button>
                                </RequestMedicineSheet>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Contact Info - REMOVED FOR MOBILE VIEW */}
                {/* <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Need assistance?</p>
                    <p className="text-sm text-muted-foreground">Call us at +91 98765 43210</p>
                  </div>
                </div>
              </CardContent>
            </Card> */}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}