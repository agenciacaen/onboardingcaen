import { useState } from 'react';
import { AdSetList } from './AdSetList';
import type { AdData } from './AdSetList';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { AdDetailModal } from './AdDetailModal';

interface AdCardGridProps {
  ads: AdData[];
}

export function AdCardGrid({ ads }: AdCardGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    // Note: AdData doesn't have platform yet, we'd add it if needed for global view
    return matchesSearch && matchesStatus;
  });

  const handleAdClick = (ad: AdData) => {
    setSelectedAd(ad);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-muted/30 p-4 rounded-lg border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pelo nome do anúncio..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="rejected">Reprovados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="meta">Meta Ads</SelectItem>
              <SelectItem value="google">Google Ads</SelectItem>
              <SelectItem value="tiktok">TikTok Ads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AdSetList ads={filteredAds} onAdClick={handleAdClick} />

      <AdDetailModal 
        ad={selectedAd} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
