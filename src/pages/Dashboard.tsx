import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderWithCredits } from '@/components/HeaderWithCredits';
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
import MobileNav from '@/components/MobileNav';
import { Video, Play, MoreVertical, Trash2, Share2, Link2, Facebook, Twitter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadVideos();
    }
  }, [user]);

  const loadVideos = async () => {
    const { data } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setVideos(data || []);
  };

  const handleCopyLink = (videoId: string) => {
    const shareableUrl = `https://selfyai.fun/v/${videoId}`;
    navigator.clipboard.writeText(shareableUrl);
    toast.success('Link copiado!', {
      description: 'O link do vídeo foi copiado para a área de transferência'
    });
  };

  const handleShare = (platform: string, videoId: string, text: string) => {
    const shareableUrl = `https://selfyai.fun/v/${videoId}`;
    
    let shareUrl = '';
    
    switch(platform) {
      case 'facebook':
        // Facebook Sharer
        shareUrl = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(shareableUrl)}`;
        break;
      case 'twitter':
        // Twitter/X Intent
        const tweetText = `${text}\n\n${shareableUrl}`;
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        break;
      case 'whatsapp':
        // WhatsApp - formato simples
        const whatsappText = `${text}\n\n${shareableUrl}`;
        shareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const confirmDelete = (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!videoToDelete) return;
    
    const { error } = await supabase
      .from('generated_videos')
      .delete()
      .eq('id', videoToDelete)
      .eq('user_id', user?.id);
    
    if (error) {
      toast.error('Erro ao excluir vídeo', {
        description: error.message
      });
    } else {
      toast.success('Vídeo excluído com sucesso!');
      loadVideos();
    }
    
    setDeleteDialogOpen(false);
    setVideoToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-safe-mobile pt-safe">
      <HeaderWithCredits />

      <main className="container mx-auto px-4 py-8 max-w-6xl pb-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-full bg-primary/10">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Vídeos Recentes</h1>
            <p className="text-muted-foreground">Seus últimos vídeos gerados</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meus Vídeos</CardTitle>
            <CardDescription>Últimos 10 vídeos gerados</CardDescription>
          </CardHeader>
          <CardContent>
            {videos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum vídeo ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando seu primeiro vídeo!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div 
                      className="aspect-video bg-muted relative cursor-pointer group"
                      onClick={() => navigate(`/v/${video.id}`)}
                    >
                      {video.video_url ? (
                        <>
                          <video 
                            src={video.video_url} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-sm line-clamp-2 mb-1">{video.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(video.id);
                          }}
                        >
                          <Link2 className="h-3.5 w-3.5 mr-1.5" />
                          Link
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Share2 className="h-3.5 w-3.5 mr-1.5" />
                              Compartilhar
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleShare('whatsapp', video.id, video.text)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('facebook', video.id, video.text)}>
                              <Facebook className="mr-2 h-4 w-4" />
                              Facebook
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('twitter', video.id, video.text)}>
                              <Twitter className="mr-2 h-4 w-4" />
                              Twitter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(video.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vídeo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O vídeo será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PushNotificationPrompt userId={user?.id} />

      <MobileNav />
    </div>
  );
}
