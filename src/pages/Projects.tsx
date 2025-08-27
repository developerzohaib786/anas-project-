import { useState } from "react";
import { Search, Filter, Grid, List, Download, Eye, MoreHorizontal, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = "grid" | "list";

const mockProjects = [
  {
    id: "1",
    name: "Summer Pool Campaign",
    type: "Photo",
    created: "2024-08-26",
    status: "completed",
    category: "Pool & Spa",
    thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
    aspectRatio: "landscape"
  },
  {
    id: "2",
    name: "Luxury Suite Showcase",
    type: "Photo", 
    created: "2024-08-25",
    status: "completed",
    category: "Accommodations",
    thumbnail: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=500&fit=crop",
    aspectRatio: "portrait"
  },
  {
    id: "3",
    name: "Family Adventure Package",
    type: "Photo",
    created: "2024-08-23", 
    status: "completed",
    category: "Activities",
    thumbnail: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=280&fit=crop",
    aspectRatio: "wide"
  },
  {
    id: "4",
    name: "Romantic Dinner Setup",
    type: "Photo",
    created: "2024-08-22",
    status: "completed", 
    category: "Dining",
    thumbnail: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=450&fit=crop",
    aspectRatio: "portrait"
  },
  {
    id: "5",
    name: "Wellness & Spa Experience",
    type: "Photo",
    created: "2024-08-21",
    status: "completed",
    category: "Pool & Spa",
    thumbnail: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=350&fit=crop",
    aspectRatio: "landscape"
  },
  {
    id: "6",
    name: "Coastal Resort Views",
    type: "Photo", 
    created: "2024-08-20",
    status: "completed",
    category: "Property",
    thumbnail: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=600&fit=crop",
    aspectRatio: "tall"
  },
  {
    id: "7",
    name: "Rooftop Terrace Evening",
    type: "Photo", 
    created: "2024-08-19",
    status: "completed",
    category: "Property",
    thumbnail: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=320&fit=crop",
    aspectRatio: "landscape"
  },
  {
    id: "8",
    name: "Beachfront Dining",
    type: "Photo", 
    created: "2024-08-18",
    status: "completed",
    category: "Dining",
    thumbnail: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=480&fit=crop",
    aspectRatio: "portrait"
  }
];

export default function Projects() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "Pool & Spa", "Accommodations", "Activities", "Dining", "Property"];

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage your created content and campaigns</p>
        </div>
        <Button>Create New Project</Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              {selectedCategory === "all" ? "All Categories" : selectedCategory}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? "All Categories" : category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex border rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {viewMode === "grid" ? (
        /* Modern Masonry Grid */
        <div className="masonry-grid">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="masonry-item group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              style={{
                boxShadow: 'var(--shadow-soft)',
                breakInside: 'avoid',
                marginBottom: '1rem'
              }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={project.thumbnail}
                  alt={project.name}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Project actions - top right */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 bg-white/95 hover:bg-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg hover:scale-110 transition-all duration-200">
                        <MoreHorizontal className="h-4 w-4 text-gray-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-2xl">📸</div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {project.category}
                        </Badge>
                        <span className="text-sm text-gray-600">•</span>
                        <span className="text-sm text-gray-600">{project.created}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {project.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== "all" 
              ? "Try adjusting your search or filters" 
              : "Create your first project to get started"}
          </p>
          <Button>Create New Project</Button>
        </div>
      )}
    </div>
  );
}