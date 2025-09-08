import { Link } from "react-router-dom";
import { Sparkles, MessageSquare, Video, Image, Clock, TrendingUp, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const recentProjects = [
    {
      id: "1",
      name: "Summer Pool Campaign",
      type: "Photo",
      created: "2 hours ago",
      status: "completed"
    },
    {
      id: "2", 
      name: "Luxury Suite Showcase",
      type: "Photo",
      created: "1 day ago",
      status: "completed"
    },
    {
      id: "3",
      name: "Family Adventure Package",
      type: "Photo", 
      created: "3 days ago",
      status: "completed"
    }
  ];

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Welcome back to Nino
        </h1>
        <p className="text-gray-600">
          Your AI creative assistant for hotel and travel marketing content
        </p>
      </div>

      {/* Main Creation Flows */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Choose Your Creation Flow</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Flow 1: Image Enhancement - RECOMMENDED */}
          <Link to="/enhance">
            <Card className="relative hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground font-medium">
                  <Star className="w-3 h-3 mr-1" />
                  Recommended
                </Badge>
              </div>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-primary/10 rounded-2xl">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Enhance Images</h3>
                    <p className="text-gray-600 mb-4">Transform your existing images into luxury hotel marketing masterpieces</p>
                    <p className="text-sm text-gray-500">Upload → AI Enhancement → Download</p>
                  </div>
                  <Button className="mt-4 group">
                    Start Enhancement
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Flow 2: Chat Creation */}
          <Link to="/create">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-gray-200 hover:border-gray-300">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-blue-50 rounded-2xl">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Chat & Create</h3>
                    <p className="text-gray-600 mb-4">Describe your vision or upload reference images to generate new content</p>
                    <p className="text-sm text-gray-500">Chat → Reference Images → Generate</p>
                  </div>
                  <Button variant="outline" className="mt-4 group">
                    Start Creating
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Flow 3: Image to Video - BETA */}
          <Link to="/video">
            <Card className="relative hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  Beta
                </Badge>
              </div>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-purple-100 rounded-2xl">
                    <Video className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Image to Video</h3>
                    <p className="text-gray-600 mb-4">Turn static images into dynamic 7-second video reels with SFX</p>
                    <p className="text-sm text-gray-500">Upload Image → AI Video → SFX Added</p>
                  </div>
                  <Button variant="outline" className="mt-4 group border-purple-200 text-purple-700 hover:bg-purple-50">
                    Try Beta
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Quick Access */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Quick Access</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/projects">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Image className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Projects</h4>
                    <p className="text-sm text-gray-600">View your content</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/brand-kit">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Brand Kit</h4>
                    <p className="text-sm text-gray-600">Manage assets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/settings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Settings</h4>
                    <p className="text-sm text-gray-600">Account settings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-gray-900">Recent Projects</h2>
          <Link to="/projects">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">{project.name}</CardTitle>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {project.type}
                  </span>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {project.created}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <Image className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    Completed
                  </span>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}