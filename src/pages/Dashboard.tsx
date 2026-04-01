import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Upload, ImageIcon, CreditCard, Clock, TrendingUp, Settings } from "lucide-react";

const stats = [
  { icon: ImageIcon, label: "Images Today", value: "3 / 5", color: "text-primary" },
  { icon: CreditCard, label: "Plan", value: "Free", color: "text-accent" },
  { icon: Clock, label: "Avg Time", value: "2.1s", color: "text-secondary" },
  { icon: TrendingUp, label: "Total Processed", value: "47", color: "text-primary" },
];

const recentUploads = [
  { name: "portrait.jpg", date: "2 hours ago", status: "Done" },
  { name: "product-photo.png", date: "5 hours ago", status: "Done" },
  { name: "team-pic.webp", date: "Yesterday", status: "Done" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back! Here's your overview.</p>
          </div>
          <Link to="/upload">
            <Button variant="cta" className="rounded-xl">
              <Upload className="w-4 h-4 mr-2" />
              New Upload
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Uploads */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
          <div className="space-y-3">
            {recentUploads.map((u) => (
              <div key={u.name} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.date}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{u.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
