import React, { useState, useEffect } from 'react';

interface AITool {
  id?: number;
  name: string;
  description?: string;
  url?: string;
  source: string;
  category?: string;
  subcategory?: string;
  capabilities?: string[];
  api_available?: boolean;
  open_source?: boolean;
  pricing_model?: string;
  popularity_score?: number;
}

interface Stats {
  total_tools: number;
  total_capabilities: number;
  successful_surveys: number;
  last_survey_run?: string;
  tools_by_category: Record<string, number>;
}

interface Project {
  id?: number;
  name: string;
  path?: string;
  description?: string;
  tech_stack?: string[];
  ai_needs?: string[];
}

export const AIKnowledgeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'categories' | 'recommendations' | 'projects' | 'stats'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AITool[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);

  // API endpoints (adjust based on your backend setup)
  const API_BASE = '/api/agents';

  useEffect(() => {
    loadStats();
    loadProjects();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects`);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);

    try {
      const response = await fetch(`${API_BASE}/category/${encodeURIComponent(category)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error loading category:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🤖 AI Knowledge Survey System</h1>
        <p style={styles.subtitle}>
          Your comprehensive AI tools and interfaces catalog
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabs}>
        {['search', 'categories', 'recommendations', 'projects', 'stats'].map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {activeTab === 'search' && (
          <div style={styles.searchTab}>
            <h2>🔍 Search AI Tools</h2>
            <div style={styles.searchBar}>
              <input
                type="text"
                placeholder="Search for AI tools, frameworks, applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={styles.searchInput}
              />
              <button onClick={handleSearch} style={styles.searchButton}>
                Search
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={styles.results}>
                <h3>{searchResults.length} Results Found</h3>
                {searchResults.map((tool, index) => (
                  <div key={index} style={styles.toolCard}>
                    <div style={styles.toolHeader}>
                      <h4 style={styles.toolName}>{tool.name}</h4>
                      <span style={styles.toolBadge}>{tool.source}</span>
                    </div>
                    <p style={styles.toolDescription}>
                      {tool.description?.substring(0, 200)}...
                    </p>
                    <div style={styles.toolMeta}>
                      <span>📁 {tool.category}</span>
                      {tool.open_source && <span>🔓 Open Source</span>}
                      {tool.api_available && <span>🔌 API Available</span>}
                      <span>⭐ {tool.popularity_score?.toFixed(1)}</span>
                    </div>
                    {tool.capabilities && tool.capabilities.length > 0 && (
                      <div style={styles.capabilities}>
                        {tool.capabilities.map((cap, i) => (
                          <span key={i} style={styles.capabilityTag}>{cap}</span>
                        ))}
                      </div>
                    )}
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.toolLink}
                    >
                      Visit Tool →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div style={styles.categoriesTab}>
            <h2>📁 Browse by Category</h2>
            {stats?.tools_by_category && (
              <div style={styles.categoryGrid}>
                {Object.entries(stats.tools_by_category).map(([category, count]) => (
                  <button
                    key={category}
                    style={{
                      ...styles.categoryCard,
                      ...(selectedCategory === category ? styles.categoryCardActive : {})
                    }}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div style={styles.categoryName}>{category}</div>
                    <div style={styles.categoryCount}>{count} tools</div>
                  </button>
                ))}
              </div>
            )}

            {searchResults.length > 0 && selectedCategory && (
              <div style={styles.results}>
                <h3>{selectedCategory} Tools</h3>
                {searchResults.map((tool, index) => (
                  <div key={index} style={styles.toolCardSmall}>
                    <h4>{tool.name}</h4>
                    <p>{tool.description?.substring(0, 150)}...</p>
                    <a href={tool.url} target="_blank" rel="noopener noreferrer">
                      Learn More →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div style={styles.recommendationsTab}>
            <h2>🎯 Personalized Recommendations</h2>
            <p style={styles.infoText}>
              Get AI tool recommendations based on your projects and preferences
            </p>

            {projects.length > 0 ? (
              <div style={styles.projectList}>
                <h3>Your Projects</h3>
                {projects.map((project) => (
                  <div key={project.id} style={styles.projectCard}>
                    <h4>{project.name}</h4>
                    <p>{project.description}</p>
                    {project.tech_stack && (
                      <div style={styles.techStack}>
                        {project.tech_stack.map((tech, i) => (
                          <span key={i} style={styles.techTag}>{tech}</span>
                        ))}
                      </div>
                    )}
                    {project.ai_needs && (
                      <div style={styles.aiNeeds}>
                        <strong>AI Needs:</strong> {project.ai_needs.join(', ')}
                      </div>
                    )}
                    <button style={styles.recommendButton}>
                      Get Recommendations
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p>No projects analyzed yet</p>
                <button style={styles.analyzeButton}>
                  Analyze a Project
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div style={styles.projectsTab}>
            <h2>📂 Your Projects</h2>
            <button style={styles.addButton}>+ Analyze New Project</button>

            {projects.length > 0 ? (
              <div style={styles.projectList}>
                {projects.map((project) => (
                  <div key={project.id} style={styles.projectCard}>
                    <h3>{project.name}</h3>
                    <p style={styles.projectPath}>{project.path}</p>
                    <p>{project.description}</p>

                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div>
                        <strong>Tech Stack:</strong>
                        <div style={styles.techStack}>
                          {project.tech_stack.map((tech, i) => (
                            <span key={i} style={styles.techTag}>{tech}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.ai_needs && project.ai_needs.length > 0 && (
                      <div style={styles.aiNeeds}>
                        <strong>AI Needs:</strong> {project.ai_needs.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p>No projects yet. Analyze your first project to get started!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div style={styles.statsTab}>
            <h2>📊 System Statistics</h2>

            {stats && (
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{stats.total_tools}</div>
                  <div style={styles.statLabel}>AI Tools</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{stats.total_capabilities}</div>
                  <div style={styles.statLabel}>Capabilities</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{stats.successful_surveys}</div>
                  <div style={styles.statLabel}>Successful Surveys</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Last Survey</div>
                  <div style={styles.statValue}>
                    {stats.last_survey_run
                      ? new Date(stats.last_survey_run).toLocaleString()
                      : 'Never'}
                  </div>
                </div>
              </div>
            )}

            <div style={styles.surveyInfo}>
              <h3>🔄 Survey Schedule</h3>
              <p>Automated surveys run 3 times daily:</p>
              <ul>
                <li>06:00 UTC</li>
                <li>14:00 UTC</li>
                <li>22:00 UTC</li>
              </ul>
              <p>Sources: HuggingFace, GitHub, YouTube, arXiv, and more</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '10px',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '2px solid #e0e0e0',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    background: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    borderBottom: '3px solid #007bff',
    color: '#007bff',
    fontWeight: 'bold',
  },
  content: {
    minHeight: '500px',
  },
  searchTab: {},
  searchBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
  },
  searchButton: {
    padding: '12px 30px',
    fontSize: '1rem',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  results: {
    marginTop: '20px',
  },
  toolCard: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  toolCardSmall: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
  },
  toolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  toolName: {
    fontSize: '1.3rem',
    margin: 0,
  },
  toolBadge: {
    background: '#e3f2fd',
    color: '#1976d2',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.85rem',
  },
  toolDescription: {
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  toolMeta: {
    display: 'flex',
    gap: '15px',
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '10px',
  },
  capabilities: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '15px',
  },
  capabilityTag: {
    background: '#f0f0f0',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.85rem',
  },
  toolLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  categoriesTab: {},
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  categoryCard: {
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  categoryCardActive: {
    borderColor: '#007bff',
    background: '#e3f2fd',
  },
  categoryName: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  categoryCount: {
    color: '#666',
    fontSize: '0.9rem',
  },
  recommendationsTab: {},
  projectsTab: {},
  infoText: {
    color: '#666',
    marginBottom: '20px',
  },
  projectList: {
    marginTop: '20px',
  },
  projectCard: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '15px',
  },
  projectPath: {
    fontSize: '0.85rem',
    color: '#888',
    fontFamily: 'monospace',
  },
  techStack: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
    marginBottom: '10px',
  },
  techTag: {
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.85rem',
  },
  aiNeeds: {
    marginTop: '10px',
    padding: '10px',
    background: '#fff3e0',
    borderRadius: '6px',
    fontSize: '0.9rem',
  },
  recommendButton: {
    marginTop: '15px',
    padding: '10px 20px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  analyzeButton: {
    marginTop: '20px',
    padding: '12px 24px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  addButton: {
    marginBottom: '20px',
    padding: '10px 20px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  statsTab: {},
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '10px',
  },
  statLabel: {
    fontSize: '1rem',
    color: '#666',
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: '0.9rem',
    color: '#333',
    marginTop: '10px',
  },
  surveyInfo: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
  },
};
