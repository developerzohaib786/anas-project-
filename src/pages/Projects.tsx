import { useState } from "react";
import { Search, Download, MoreHorizontal, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

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
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCreateProject = () => {
    navigate('/');
  };

  const handleDownload = (project: typeof mockProjects[0]) => {
    // Download functionality
    console.log('Downloading:', project.name);
  };

  const handleResize = (project: typeof mockProjects[0], aspectRatio: string) => {
    // Resize functionality
    console.log('Resizing:', project.name, 'to', aspectRatio);
  };

  return (
      <div className="p-8 md:p-8 p-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Manage your created content and campaigns</p>
          </div>
        </div>

        {/* Search and Create Button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-gray-200 focus:border-primary/20 focus:ring-primary/10"
            />
          </div>
          <Button 
            onClick={handleCreateProject}
            className="apple-button bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-medium w-full md:w-auto"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Create New Project
          </Button>
        </div>

      {/* Projects Masonry Grid */}
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
                    <DropdownMenuItem onClick={() => handleDownload(project)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResize(project, '1:1')}>
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Resize to 1:1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResize(project, '4:5')}>
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Resize to 4:5
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResize(project, '9:16')}>
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Resize to 9:16
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResize(project, '16:9')}>
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Resize to 16:9
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ boxShadow: 'var(--shadow-minimal)' }}>
            <div className="text-4xl">📁</div>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-3">No projects found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {searchQuery 
              ? "Try adjusting your search terms" 
              : "Create your first project to get started"}
          </p>
          <Button 
            onClick={handleCreateProject}
            className="apple-button bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-medium"
            style={{ boxShadow: 'var(--shadow-button)' }}
          >
            Create New Project
          </Button>
        </div>
      )}
    </div>
  );
}