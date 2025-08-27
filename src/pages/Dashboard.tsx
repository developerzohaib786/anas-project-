import { Link } from "react-router-dom";
import { Plus, Image, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/create">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-900 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Create Content</h3>
                    <p className="text-sm text-gray-600">Start a new campaign</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/projects">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Image className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">View Projects</h3>
                    <p className="text-sm text-gray-600">Browse your content</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/brand-kit">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Brand Kit</h3>
                    <p className="text-sm text-gray-600">Manage brand assets</p>
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