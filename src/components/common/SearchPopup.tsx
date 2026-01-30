import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import LottieAnimation from "@/components/common/LottieAnimation";

// Import category animations
import allergyAnim from "@/assets/animations/category-allergy.json";
import antibioticsAnim from "@/assets/animations/category-antibiotics.json";
import babyAnim from "@/assets/animations/category-baby.json";
import coldFluAnim from "@/assets/animations/category-cold-flu.json";
import painAnim from "@/assets/animations/category-pain.json";
import vitaminsAnim from "@/assets/animations/category-vitamins.json";

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

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface SearchPopupProps {
  searchQuery: string;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'details';
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
  const { isAuthenticated, isAdmin } = useAuth();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { deliveryEnabled } = useFeatureFlags(); // Add this line

  const [activeTab, setActiveTab] = useState<'details'>('details');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);

  // Define category animations
  const categoryAnimations: Record<string, any> = {
    "Baby Products": babyAnim,
    "Allergy": allergyAnim,
    "Cold & Flu": coldFluAnim,
    "Antibiotics": antibioticsAnim,
    "Pain Relief": painAnim,
    "Vitamins": vitaminsAnim,
    "Proton Pump Inhibitor": painAnim,
  };

  // Function to get category name by ID
  const getCategoryNameById = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  // Function to get animation data for a category
  const getCategoryAnimation = (categoryName: string) => {
    // Return specific animation if exists, otherwise default to pain animation
    return categoryAnimations[categoryName] || painAnim;
  };

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"));
        const querySnapshot = await getDocs(q);
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // When the popup opens or initialTab changes, update the active tab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'details');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    // Auto-open popup when there's a search query and it's not already open
    if (searchQuery && !isOpen) {
      // Note: We can't directly modify isOpen since it's a prop
      // The parent component should handle this logic
    }
    
    if (isOpen && searchQuery) {
      searchProducts();
      fetchDiscount();
    }
  }, [isOpen, searchQuery]);

  // Load reviews when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      loadReviews(selectedProduct.id);
    }
  }, [selectedProduct]);

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
    if (!searchQuery.trim()) {
      return;
    }

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
      // Simple query without orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'product_reviews'),
        where('product_id', '==', productId)
      );

      const querySnapshot = await getDocs(q);
      
      const reviewsData: any[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      
      // Sort reviews by created_at in descending order (newest first)
      reviewsData.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!selectedProduct) return;

    // Validate required fields
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a review title');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please enter your review');
      return;
    }

    setSubmittingReview(true);
    try {
      let userId: string;
      let isAnonymous = false;

      if (isAuthenticated && auth.currentUser) {
        // Authenticated user
        userId = auth.currentUser.uid;
        
        // Check if authenticated user already reviewed
        const q = query(
          collection(db, 'product_reviews'),
          where('product_id', '==', selectedProduct.id),
          where('user_id', '==', userId)
        );
        const existingReviews = await getDocs(q);

        if (!existingReviews.empty) {
          toast.error('You have already reviewed this product');
          setSubmittingReview(false);
          return;
        }
      } else {
        // Anonymous user
        isAnonymous = true;
        
        // Generate or get existing anonymous ID
        let anonymousId = localStorage.getItem('anonymous_review_id');
        if (!anonymousId) {
          anonymousId = 'anonymous_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('anonymous_review_id', anonymousId);
        }
        userId = anonymousId;

        // Check if this anonymous user already reviewed this product
        const q = query(
          collection(db, 'product_reviews'),
          where('product_id', '==', selectedProduct.id),
          where('user_id', '==', userId)
        );
        const existingReviews = await getDocs(q);

        if (!existingReviews.empty) {
          toast.error('You have already reviewed this product');
          setSubmittingReview(false);
          return;
        }
      }

      const docRef = await addDoc(collection(db, 'product_reviews'), {
        product_id: selectedProduct.id,
        user_id: userId,
        rating,
        title,
        comment,
        verified_purchase: false, // Logic to check verification can be added later
        helpful_count: 0,
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString()
      });

      // Wait a short time for Firestore to index the document
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Review submitted successfully');
      setTitle("");
      setComment("");
      setRating(5);
      loadReviews(selectedProduct.id);
    } catch (error: any) {
      toast.error('Failed to submit review');
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
    const calculatedAverageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[70vw] lg:w-[60vw] max-w-3xl h-auto max-h-[85vh] flex flex-col p-0 overflow-hidden border border-slate-200 shadow-2xl rounded-xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] bg-white mx-0 my-0">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-3 sm:p-4 text-white relative overflow-hidden rounded-t-xl">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-white truncate pr-8">
                  {selectedProduct.name}
                </DialogTitle>
                <div className="flex justify-between items-center mt-1 sm:mt-2">
                  {showBackButton && (
                    <Button
                      variant="ghost"
                      onClick={handleBackToList}
                      className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 text-white hover:bg-white/20 border border-white/20"
                    >
                      ← Back
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
    
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 relative z-10">
                {/* Product Image and Category - Hidden on mobile */}
                <div className="hidden md:flex flex-col gap-4">
                  <div className="w-2/3 sm:w-1/2 mx-auto rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm aspect-[1/1] flex items-center justify-center p-1">
                    {selectedProduct.image_url ? (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        {selectedProduct.category_id ? (
                          <div className="w-10 h-10 sm:w-12 md:w-16 sm:h-12 md:h-16">
                            <LottieAnimation animationData={getCategoryAnimation(getCategoryNameById(selectedProduct.category_id))} />
                          </div>
                        ) : (
                          <span className="text-xl sm:text-2xl md:text-3xl">💊</span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Category Name */}
                  <div className="text-center">
                    <Badge 
                      variant="outline" 
                      className="text-[0.65rem] px-2 py-0.5 font-medium tracking-wide uppercase bg-slate-50 text-slate-700 border-slate-200"
                    >
                      {selectedProduct.category_id 
                        ? getCategoryNameById(selectedProduct.category_id) 
                        : (selectedProduct.categories?.name || "Uncategorized")}
                    </Badge>
                  </div>
                      
                  {/* Reviews Section Below Image */}
                  <div className="space-y-3 bg-white rounded-lg border border-slate-200 shadow-sm p-3 md:p-4">
                    {/* Reviews Summary - Clickable stars and review count */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <div className="text-xl md:text-2xl font-bold">{calculatedAverageRating.toFixed(1)}</div>
                          <div 
                            className="flex items-center justify-center gap-1 my-1 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setShowAllReviewsModal(true)}
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= calculatedAverageRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                          <div 
                            className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setShowAllReviewsModal(true)}
                          >
                            {reviews.length} reviews
                          </div>
                        </div>
                      </div>
                      {!isAdmin && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs"
                          onClick={() => setShowReviewModal(true)}
                        >
                          Leave a Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
    
                {/* Product Info - Takes full width on mobile, half on desktop */}
                <div className="w-full md:w-auto md:flex-1 space-y-3 overflow-y-auto max-h-[75vh] md:max-h-none bg-white rounded-lg border border-slate-200 shadow-sm p-3 md:p-4">
                  <div>
                    {!selectedProduct.in_stock && (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
    
                  {/* Product Details */}
                  <div className="space-y-2">
                    {/* Product Details */}
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 md:max-h-[320px]">
                      {selectedProduct.description && (
                        <div>
                          <h3 className="text-sm md:text-base font-semibold mb-1">Description</h3>
                          <p className="text-muted-foreground text-xs md:text-sm">{selectedProduct.description}</p>
                        </div>
                      )}
    
                      {selectedProduct.composition && (
                        <div>
                          <h3 className="text-sm md:text-base font-semibold mb-1">Composition</h3>
                          <p className="text-muted-foreground text-xs md:text-sm">{selectedProduct.composition}</p>
                        </div>
                      )}
    
                      {selectedProduct.uses && (
                        <div>
                          <h3 className="text-sm md:text-base font-semibold mb-1">Uses</h3>
                          <p className="text-muted-foreground text-xs md:text-sm">{selectedProduct.uses}</p>
                        </div>
                      )}
    
                      {selectedProduct.side_effects && (
                        <div>
                          <h3 className="text-sm md:text-base font-semibold mb-1">Side Effects</h3>
                          <p className="text-muted-foreground text-xs md:text-sm">{selectedProduct.side_effects}</p>
                        </div>
                      )}
    
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <h4 className="font-medium text-xs text-muted-foreground">Availability</h4>
                          <p className={`font-medium text-xs ${selectedProduct.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedProduct.in_stock ? 'In Stock' : 'Out of Stock'}
                          </p>
                        </div>
                        {selectedProduct.stock_quantity !== undefined && selectedProduct.stock_quantity > 0 && (
                          <div>
                            <h4 className="font-medium text-xs text-muted-foreground">Stock</h4>
                            <p className="font-medium text-xs">{selectedProduct.stock_quantity} units</p>
                          </div>
                        )}
                      </div>
                    </div>
    
                    {/* Pricing */}
                    <div className="p-2 bg-card rounded-md">
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-base md:text-lg font-bold text-primary">
                          ₹{discountedPrice.toFixed(2)}
                        </span>
                        {discountPercentage > 0 && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{selectedProduct.original_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {discountPercentage > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5">
                            {discountPercentage}% OFF
                          </Badge>
                          <span className="text-secondary font-semibold text-xs">
                            Save ₹{savings.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        {/* Request Availability button should only show for out-of-stock products */}
                        {!selectedProduct.in_stock && (
                          <RequestMedicineSheet medicineName={selectedProduct.name}>
                            <Button 
                              className="w-full h-7 text-xs" 
                              size="sm"
                              onClick={(e) => {
                                // Prevent event from bubbling up to parent components
                                e.stopPropagation();
                              }}
                            >
                              <PackagePlus className="w-3 h-3 mr-1.5" />
                              Request
                            </Button>
                          </RequestMedicineSheet>
                        )}
                        {/* Add to Cart button should only show for in-stock products and when delivery is enabled */}
                        {selectedProduct.in_stock && deliveryEnabled && (
                          <Button
                            className="w-full h-7 text-xs"
                            size="sm"
                            onClick={() => handleAddToCart(selectedProduct)}
                          >
                            <ShoppingCart className="w-3 h-3 mr-1.5" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    
        {/* Review Modal */}
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent className="max-w-md z-[60]">
            <DialogHeader>
              <DialogTitle>Leave a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Rating</label>
                <div className="flex gap-1 justify-center">
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
                <label className="text-sm font-medium mb-1 block">Review Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                />
              </div>
    
              <div>
                <label className="text-sm font-medium mb-1 block">Review</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product"
                  rows={3}
                />
              </div>
    
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewModal(false);
                    // Reset form
                    setRating(0);
                    setTitle("");
                    setComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await submitReview();
                    if (!submittingReview) {
                      setShowReviewModal(false);
                      // Reset form
                      setRating(0);
                      setTitle("");
                      setComment("");
                    }
                  }}
                  disabled={submittingReview}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    
        {/* All Reviews Modal */}
        <Dialog open={showAllReviewsModal} onOpenChange={setShowAllReviewsModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-[60]">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl">Customer Reviews</DialogTitle>
              <DialogDescription>
                {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>
                
            <div className="space-y-4">
              {/* Reviews Summary */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{(reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0).toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">{reviews.length} reviews</div>
                </div>
                    
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter(r => r.rating === stars).length;
                    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                    return (
                    <div key={stars} className="flex items-center gap-2 mb-1">
                      <span className="text-sm w-4">{stars}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {percentage}%
                      </span>
                    </div>
                  )})}
                </div>
              </div>
                  
              {/* Reviews List */}
              <div className="space-y-4">
                {reviewsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating
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
                          <h4 className="font-semibold mb-1">{review.title}</h4>
                        )}
                            
                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[70vw] lg:w-[60vw] max-w-3xl h-auto max-h-[85vh] flex flex-col p-0 overflow-hidden border border-slate-200 shadow-2xl rounded-xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] bg-white mx-0 my-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-3 sm:p-4 text-white relative overflow-hidden rounded-t-xl">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-white">Search Results for "{searchQuery}"</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 relative p-2 sm:p-3 md:p-4">
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
                          <div className="flex flex-col sm:flex-row gap-4">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-md self-center sm:self-start"
                              />
                            ) : (
                              <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md self-center sm:self-start">
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