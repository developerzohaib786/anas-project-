import { useState } from "react";
import { Search, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects] = useState<any[]>([]); // Empty projects array - users will create their own
  const navigate = useNavigate();

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = () => {
    navigate('/');
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-8 w-full max-w-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
            Projects
          </h1>
          <p className="text-muted-foreground">Manage your created content and campaigns</p>
        </div>
      </div>

      {/* Only show search/controls if there are projects */}
      {projects.length > 0 && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          <Button 
            onClick={handleCreateProject}
            className="w-full md:w-auto shadow-lg"
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Project
          </Button>
        </div>
      )}

      {/* Projects Grid - will be populated when users create projects */}
      {filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group relative bg-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border"
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={project.thumbnail}
                  alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-foreground mb-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground">{project.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Start creating amazing content for your brand. Your AI-generated projects will appear here once you begin creating."
          actionLabel="Create Your First Project"
          onAction={handleCreateProject}
        />
      )}

      {/* No search results */}
      {projects.length > 0 && filteredProjects.length === 0 && (
        <EmptyState
          icon={Search}
          title="No projects found"
          description="Try adjusting your search terms to find what you're looking for."
          actionLabel="Clear Search"
          onAction={() => setSearchQuery("")}
        />
      )}
    </div>
  );
}