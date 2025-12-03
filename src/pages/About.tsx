import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Award, Users, Clock, Package, Store, Home } from "lucide-react";
import KalyanamLogo from "@/components/svgs/KalyanamLogo";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => navigate("/")}
            >
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg">
                <KalyanamLogo className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Kalyanam Pharmaceuticals</h1>
                <p className="text-sm text-primary-foreground/90">Your Trusted Healthcare Partner</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium flex items-center gap-2"
              onClick={() => navigate("/")}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">About Us</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            Your trusted healthcare partner, serving the community with quality medicines and compassionate care.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground mb-4">
              Kalyanam Pharmaceuticals is a newly started pharmacy with a vision to make quality healthcare accessible to everyone in our community. Under the leadership of our owner, Pallavan Dixit, we are committed to providing top-class facilities and assurance to each and every customer.
            </p>
            <p className="text-muted-foreground mb-4">
              As a new establishment, we promise to serve each and every customer with top class facility and assurance. We believe that healthcare is not just about medicines, but about building relationships and understanding the unique needs of each customer.
            </p>
            <p className="text-muted-foreground mb-4">
              We want to assure all our customers that Kalyanam will always be there for everyone, providing not just medicines but also expert advice, health consultations, and wellness solutions. Our team is dedicated to ensuring you receive the best possible care.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Store className="w-24 h-24 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2">New Beginnings</h3>
                <p className="text-muted-foreground">
                  Starting fresh to serve you better
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="p-3 rounded-full bg-primary/10 w-fit">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="mt-4">Compassionate Care</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We treat every customer with empathy and understanding, recognizing that health concerns can be stressful.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="p-3 rounded-full bg-primary/10 w-fit">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="mt-4">Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We source only from trusted manufacturers and maintain strict quality control standards.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="p-3 rounded-full bg-primary/10 w-fit">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="mt-4">Community Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We're deeply rooted in our community and committed to its health and wellbeing.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-muted/30 rounded-xl">
              <Package className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Wide Range</h3>
              <p className="text-muted-foreground text-sm">
                Over 10,000 products including prescription medications, OTC drugs, and health supplements
              </p>
            </div>
            
            <div className="text-center p-6 bg-muted/30 rounded-xl">
              <Clock className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Extended Hours</h3>
              <p className="text-muted-foreground text-sm">
                Open 15 hours a day to serve you when you need us most
              </p>
            </div>
            
            <div className="text-center p-6 bg-muted/30 rounded-xl">
              <Users className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Expert Advice</h3>
              <p className="text-muted-foreground text-sm">
                Qualified pharmacists available to answer your health questions
              </p>
            </div>
            
            <div className="text-center p-6 bg-muted/30 rounded-xl">
              <Heart className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Personal Service</h3>
              <p className="text-muted-foreground text-sm">
                Tailored healthcare solutions for your unique needs
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Our Commitment</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-8">
            At Kalyanam Pharmaceuticals, we're committed to being more than just a pharmacy. We're your healthcare partner, 
            dedicated to improving the health and wellbeing of our community through accessible, affordable, and quality healthcare solutions. 
            Under the ownership of Pallavan Dixit, we assure you that Kalyanam will always be there for everyone.
          </p>
          <Button 
            size="lg" 
            className="rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            onClick={() => navigate("/contact")}
          >
            Visit Our Store
          </Button>
        </div>
      </div>
    </div>
  );
};

export default About;