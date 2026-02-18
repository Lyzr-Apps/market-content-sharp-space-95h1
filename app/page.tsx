'use client'

import { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/utils'
import { useLyzrAgentEvents } from '@/lib/lyzrAgentEvents'
import { AgentActivityPanel } from '@/components/AgentActivityPanel'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  Send, Settings, Clock, Search, Filter,
  Check, X, AlertCircle, Loader2, Home, FileText, Globe,
  Zap, Eye, Copy, Tag, BarChart3, TrendingUp, Sparkles,
  Menu, ArrowRight, ExternalLink, Twitter, Instagram, Youtube
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTENT_ORCHESTRATOR_ID = '699643be7c10308731d1314a'
const PUBLISHER_AGENT_ID = '699643dbfa7935fa886621c7'
const SEO_RESEARCH_AGENT_ID = '699643ab8c4e22200a885a39'
const COPYWRITING_AGENT_ID = '699643ab7952db745690f16d'

const AGENTS_INFO = [
  { id: CONTENT_ORCHESTRATOR_ID, name: 'Content Orchestrator', role: 'Manager - coordinates SEO + Copywriting' },
  { id: SEO_RESEARCH_AGENT_ID, name: 'SEO Research Agent', role: 'Sub-agent - keyword & trend research' },
  { id: COPYWRITING_AGENT_ID, name: 'Copywriting Agent', role: 'Sub-agent - platform-specific copy' },
  { id: PUBLISHER_AGENT_ID, name: 'Multi-Platform Publisher', role: 'Independent - publishes to platforms' },
]

const PLATFORMS = ['Twitter', 'Instagram', 'YouTube Shorts', 'Fanvue'] as const
const CONTENT_TYPES = ['post', 'caption', 'short script', 'product description'] as const

const HISTORY_KEY = 'content_creation_history'
const SETTINGS_KEY = 'brand_settings'

// ─── Theme ───────────────────────────────────────────────────────────────────

const THEME_VARS: Record<string, string> = {
  '--background': '30 40% 98%',
  '--foreground': '20 40% 10%',
  '--card': '30 40% 96%',
  '--card-foreground': '20 40% 10%',
  '--primary': '24 95% 53%',
  '--primary-foreground': '30 40% 98%',
  '--secondary': '30 35% 92%',
  '--secondary-foreground': '20 40% 10%',
  '--accent': '12 80% 50%',
  '--accent-foreground': '30 40% 98%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '30 40% 98%',
  '--muted': '30 30% 90%',
  '--muted-foreground': '20 25% 45%',
  '--border': '30 35% 88%',
  '--ring': '24 95% 53%',
  '--radius': '0.875rem',
  '--sidebar-background': '30 38% 95%',
  '--sidebar-primary': '24 95% 53%',
} as Record<string, string>

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface OrchestratorContent {
  seo_keywords?: string[]
  trending_topics?: string[]
  optimization_strategy?: string
  recommended_hashtags?: string[]
  twitter_post?: string
  instagram_caption?: string
  youtube_shorts_script?: string
  fanvue_post?: string
  seo_title?: string
  meta_description?: string
  content_summary?: string
}

interface PublishStatus {
  twitter_status?: string
  twitter_url?: string
  instagram_status?: string
  youtube_status?: string
  fanvue_status?: string
  overall_status?: string
  errors?: string[]
}

interface ContentHistoryItem {
  id: string
  timestamp: string
  topic: string
  contentType: string
  platforms: string[]
  content: OrchestratorContent
  publishStatus: PublishStatus
}

interface BrandSettings {
  brandVoice: string
  styleGuidelines: string
  vocabularyDos: string
  vocabularyDonts: string
  demographics: string
  painPoints: string
  messagingPreferences: string
  seoKeywords: string
  contentPillars: string
  restrictedLanguage: string
}

interface ContentForm {
  topic: string
  platforms: string[]
  contentType: string
  instructions: string
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

const SAMPLE_CONTENT: OrchestratorContent = {
  seo_keywords: ['sustainable fashion', 'eco-friendly clothing', 'green style tips', 'conscious wardrobe'],
  trending_topics: ['capsule wardrobe challenge', 'thrift flip trends', 'ethical brand spotlight'],
  optimization_strategy: 'Focus on long-tail keywords combining sustainability with seasonal fashion trends. Target micro-moments when users search for outfit ideas and pair with environmental messaging.',
  recommended_hashtags: ['#SustainableFashion', '#EcoStyle', '#ConsciousCloset', '#GreenFashion', '#ThriftFlip'],
  twitter_post: 'Your closet can change the world. 3 simple swaps to make your wardrobe more sustainable without sacrificing style. Thread incoming...',
  instagram_caption: 'Sustainable style is not about perfection -- it is about progress. Here are 5 easy ways to build a conscious wardrobe that looks AND feels good. Save this for your next shopping trip!\n\n1. Choose quality over quantity\n2. Support ethical brands\n3. Embrace secondhand\n4. Learn basic repairs\n5. Build a capsule collection\n\nWhich tip are you trying first? Drop a comment below!',
  youtube_shorts_script: '[HOOK] Stop buying fast fashion -- here is why.\n[PROBLEM] The average person throws away 70 lbs of clothing per year.\n[SOLUTION] Try the 30-wear test: if you would not wear it 30 times, do not buy it.\n[CTA] Follow for more sustainable style tips!',
  fanvue_post: 'Exclusive behind-the-scenes look at my sustainable wardrobe overhaul! I am sharing my complete capsule wardrobe guide with measurements, brand recommendations, and styling combinations you will not find anywhere else.',
  seo_title: '5 Easy Steps to Build a Sustainable Wardrobe in 2025',
  meta_description: 'Discover practical tips for building an eco-friendly wardrobe. Learn sustainable fashion swaps, ethical brand picks, and capsule wardrobe strategies.',
  content_summary: 'A comprehensive multi-platform content package focused on sustainable fashion, targeting eco-conscious consumers with actionable wardrobe tips.',
}

const SAMPLE_PUBLISH_STATUS: PublishStatus = {
  twitter_status: 'success',
  twitter_url: 'https://twitter.com/example/status/123456789',
  instagram_status: 'success',
  youtube_status: 'pending',
  fanvue_status: 'success',
  overall_status: 'Published to 3/4 platforms successfully',
  errors: [],
}

const SAMPLE_HISTORY: ContentHistoryItem[] = [
  {
    id: 'sample-1',
    timestamp: '2025-02-18T10:30:00Z',
    topic: 'Sustainable Fashion Tips',
    contentType: 'post',
    platforms: ['Twitter', 'Instagram', 'YouTube Shorts', 'Fanvue'],
    content: SAMPLE_CONTENT,
    publishStatus: SAMPLE_PUBLISH_STATUS,
  },
  {
    id: 'sample-2',
    timestamp: '2025-02-17T14:15:00Z',
    topic: 'AI Productivity Tools Review',
    contentType: 'caption',
    platforms: ['Twitter', 'Instagram'],
    content: {
      seo_keywords: ['AI tools', 'productivity', 'automation'],
      trending_topics: ['AI assistants', 'workflow automation'],
      optimization_strategy: 'Leverage curiosity-driven headlines with benefit-focused copy.',
      recommended_hashtags: ['#AITools', '#Productivity', '#TechReview'],
      twitter_post: 'I tested 10 AI productivity tools so you do not have to. Here are the 3 that actually saved me 5+ hours per week.',
      instagram_caption: 'AI is not replacing you -- it is freeing you. Here are my top 3 AI tools that transformed my workflow this month.',
      seo_title: 'Top 3 AI Productivity Tools That Actually Work in 2025',
      meta_description: 'Discover the best AI productivity tools reviewed and tested for real workflow improvements.',
      content_summary: 'Multi-platform content reviewing AI productivity tools with practical recommendations.',
    },
    publishStatus: {
      twitter_status: 'success',
      instagram_status: 'success',
      overall_status: 'Published to 2/2 platforms successfully',
      errors: [],
    },
  },
  {
    id: 'sample-3',
    timestamp: '2025-02-16T09:00:00Z',
    topic: 'Morning Routine Optimization',
    contentType: 'short script',
    platforms: ['YouTube Shorts', 'Instagram'],
    content: {
      seo_keywords: ['morning routine', 'productivity habits', 'wellness'],
      trending_topics: ['5AM club', 'morning optimization'],
      optimization_strategy: 'Target early-morning search queries with motivational content.',
      recommended_hashtags: ['#MorningRoutine', '#ProductivityHacks', '#WellnessTips'],
      youtube_shorts_script: '[HOOK] This 5-minute morning hack changed everything.\n[CONTENT] Cold water, gratitude journal, 2-min stretch.\n[CTA] Try it tomorrow and comment your results!',
      instagram_caption: 'My non-negotiable morning routine in under 10 minutes. Simple, effective, and science-backed.',
      seo_title: 'The 5-Minute Morning Routine That Boosts Productivity',
      meta_description: 'Optimize your mornings with this quick, science-backed routine for better focus and energy.',
      content_summary: 'Short-form content about morning routine optimization for wellness-focused audiences.',
    },
    publishStatus: {
      youtube_status: 'success',
      instagram_status: 'failed',
      overall_status: 'Published to 1/2 platforms',
      errors: ['Instagram: Rate limit exceeded, retry in 15 minutes'],
    },
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (line.startsWith('['))
          return <p key={i} className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>{formatInline(line)}</p>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function getStatusColor(status?: string): string {
  if (!status) return 'bg-gray-100 text-gray-600'
  const lower = status.toLowerCase()
  if (lower.includes('success') || lower.includes('posted') || lower.includes('published')) return 'bg-green-100 text-green-700 border-green-200'
  if (lower.includes('fail') || lower.includes('error')) return 'bg-red-100 text-red-700 border-red-200'
  if (lower.includes('pending') || lower.includes('retry') || lower.includes('rate')) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-gray-100 text-gray-600'
}

function getPlatformIcon(platform: string) {
  const lower = platform.toLowerCase()
  if (lower.includes('twitter')) return <Twitter className="h-4 w-4" />
  if (lower.includes('instagram')) return <Instagram className="h-4 w-4" />
  if (lower.includes('youtube')) return <Youtube className="h-4 w-4" />
  if (lower.includes('fanvue')) return <Sparkles className="h-4 w-4" />
  return <Globe className="h-4 w-4" />
}

function getPlatformContent(content: OrchestratorContent, platform: string): string {
  const lower = platform.toLowerCase()
  if (lower.includes('twitter')) return content?.twitter_post ?? ''
  if (lower.includes('instagram')) return content?.instagram_caption ?? ''
  if (lower.includes('youtube')) return content?.youtube_shorts_script ?? ''
  if (lower.includes('fanvue')) return content?.fanvue_post ?? ''
  return ''
}

function getPlatformStatus(status: PublishStatus, platform: string): string {
  const lower = platform.toLowerCase()
  if (lower.includes('twitter')) return status?.twitter_status ?? ''
  if (lower.includes('instagram')) return status?.instagram_status ?? ''
  if (lower.includes('youtube')) return status?.youtube_status ?? ''
  if (lower.includes('fanvue')) return status?.fanvue_status ?? ''
  return ''
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SidebarNav({ activeScreen, onNavigate, collapsed, onToggle }: {
  activeScreen: string
  onNavigate: (screen: string) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'history', label: 'Content History', icon: FileText },
    { key: 'settings', label: 'Brand Settings', icon: Settings },
  ]

  return (
    <div className={cn("flex flex-col h-full border-r border-border transition-all duration-300 shrink-0", collapsed ? 'w-16' : 'w-60')} style={{ background: 'hsl(var(--sidebar-background))' }}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary))' }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Content Studio</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className="shrink-0">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn("flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200", isActive ? 'text-white shadow-md' : 'hover:bg-secondary/80')}
              style={isActive ? { background: 'hsl(var(--primary))' } : { color: 'hsl(var(--muted-foreground))' }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Agents</p>
            {AGENTS_INFO.map((agent) => (
              <div key={agent.id} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }} title={agent.role}>{agent.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContentResultView({ content, publishStatus, onCopy }: {
  content: OrchestratorContent
  publishStatus: PublishStatus | null
  onCopy: (text: string) => void
}) {
  return (
    <div className="space-y-4">
      {content?.content_summary && (
        <Card className="border-border" style={{ background: 'hsl(var(--card))' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <BarChart3 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> Content Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{content.content_summary}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border" style={{ background: 'hsl(var(--card))' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> SEO & Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {content?.seo_title && (
            <div>
              <Label className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>SEO Title</Label>
              <p className="text-sm font-medium mt-1" style={{ color: 'hsl(var(--foreground))' }}>{content.seo_title}</p>
            </div>
          )}
          {content?.meta_description && (
            <div>
              <Label className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Meta Description</Label>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--foreground))' }}>{content.meta_description}</p>
            </div>
          )}
          {content?.optimization_strategy && (
            <div>
              <Label className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Optimization Strategy</Label>
              <div className="mt-1" style={{ color: 'hsl(var(--foreground))' }}>{renderMarkdown(content.optimization_strategy)}</div>
            </div>
          )}
          {Array.isArray(content?.seo_keywords) && content.seo_keywords.length > 0 && (
            <div>
              <Label className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Keywords</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {content.seo_keywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(content?.trending_topics) && content.trending_topics.length > 0 && (
            <div>
              <Label className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Trending Topics</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {content.trending_topics.map((tp, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{tp}</Badge>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(content?.recommended_hashtags) && content.recommended_hashtags.length > 0 && (
            <div>
              <Label className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Hashtags</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {content.recommended_hashtags.map((ht, i) => (
                  <Badge key={i} className="text-xs" style={{ background: 'hsl(var(--accent))', color: 'white' }}>{ht}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content?.twitter_post && (
          <PlatformContentCard platform="Twitter" content={content.twitter_post} status={publishStatus?.twitter_status} url={publishStatus?.twitter_url} onCopy={onCopy} />
        )}
        {content?.instagram_caption && (
          <PlatformContentCard platform="Instagram" content={content.instagram_caption} status={publishStatus?.instagram_status} onCopy={onCopy} />
        )}
        {content?.youtube_shorts_script && (
          <PlatformContentCard platform="YouTube Shorts" content={content.youtube_shorts_script} status={publishStatus?.youtube_status} onCopy={onCopy} />
        )}
        {content?.fanvue_post && (
          <PlatformContentCard platform="Fanvue" content={content.fanvue_post} status={publishStatus?.fanvue_status} onCopy={onCopy} />
        )}
      </div>

      {publishStatus && (
        <Card className="border-border" style={{ background: 'hsl(var(--card))' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <Globe className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> Publishing Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {publishStatus.overall_status && (
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{publishStatus.overall_status}</p>
            )}
            {Array.isArray(publishStatus?.errors) && publishStatus.errors.length > 0 && (
              <div className="space-y-1">
                {publishStatus.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PlatformContentCard({ platform, content, status, url, onCopy }: {
  platform: string
  content: string
  status?: string
  url?: string
  onCopy: (text: string) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await onCopy(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border" style={{ background: 'hsl(var(--card))' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            {getPlatformIcon(platform)}
            {platform}
          </CardTitle>
          <div className="flex items-center gap-2">
            {status && (
              <Badge className={cn('text-xs', getStatusColor(status))}>{status}</Badge>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm whitespace-pre-wrap" style={{ color: 'hsl(var(--foreground))' }}>
          {renderMarkdown(content)}
        </div>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs mt-2 hover:underline" style={{ color: 'hsl(var(--primary))' }}>
            View post <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}

function RecentPublicationCard({ item, onView }: {
  item: ContentHistoryItem
  onView: (item: ContentHistoryItem) => void
}) {
  const platformStatuses = (Array.isArray(item?.platforms) ? item.platforms : []).map((p) => ({
    name: p,
    status: getPlatformStatus(item?.publishStatus ?? {}, p),
  }))

  return (
    <Card className="border-border cursor-pointer hover:shadow-md transition-all duration-200" style={{ background: 'hsl(var(--card))' }} onClick={() => onView(item)}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium line-clamp-1" style={{ color: 'hsl(var(--foreground))' }}>{item?.topic ?? 'Untitled'}</p>
          <Badge variant="outline" className="text-xs shrink-0 capitalize">{item?.contentType ?? ''}</Badge>
        </div>
        <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {item?.content?.content_summary ?? getPlatformContent(item?.content ?? {}, (Array.isArray(item?.platforms) ? item.platforms : [])[0] ?? '').slice(0, 100)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {platformStatuses.map((ps, i) => (
            <div key={i} className="flex items-center gap-1">
              {getPlatformIcon(ps.name)}
              {ps.status && <Badge className={cn('text-xs px-1.5 py-0', getStatusColor(ps.status))}>{ps.status}</Badge>}
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Clock className="h-3 w-3 inline mr-1" />{formatTimestamp(item?.timestamp ?? '')}
        </p>
      </CardContent>
    </Card>
  )
}

function LoadingOverlay({ phase, progress }: { phase: string; progress: number }) {
  return (
    <Card className="border-border" style={{ background: 'hsl(var(--card))' }}>
      <CardContent className="py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div className="text-center space-y-2 w-full max-w-xs">
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{phase}</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{Math.round(progress)}% complete</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Page() {
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sampleDataOn, setSampleDataOn] = useState(false)

  const [form, setForm] = useState<ContentForm>({ topic: '', platforms: [], contentType: '', instructions: '' })

  const [generatedContent, setGeneratedContent] = useState<OrchestratorContent | null>(null)
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null)

  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [activeAgentIdState, setActiveAgentIdState] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [history, setHistory] = useState<ContentHistoryItem[]>([])
  const [historySearch, setHistorySearch] = useState('')
  const [historyPlatformFilter, setHistoryPlatformFilter] = useState('all')
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all')

  const [settings, setSettings] = useState<BrandSettings>({
    brandVoice: '', styleGuidelines: '', vocabularyDos: '', vocabularyDonts: '',
    demographics: '', painPoints: '', messagingPreferences: '',
    seoKeywords: '', contentPillars: '', restrictedLanguage: '',
  })
  const [settingsSaved, setSettingsSaved] = useState(false)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const agentActivity = useLyzrAgentEvents(sessionId)

  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  // ─── localStorage Effects ──────────────────────────────────────────────────

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch { /* ignore */ }

    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch { /* ignore */ }
  }, [history])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCopy = useCallback(async (text: string) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopyStatus('Copied to clipboard!')
      setTimeout(() => setCopyStatus(null), 2000)
    }
  }, [])

  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch { /* ignore */ }
  }, [settings])

  const buildPromptMessage = useCallback((): string => {
    let message = `Create content for the following:\n\nTopic/Brief: ${form.topic}\n`
    if (form.platforms.length > 0) {
      message += `Target Platforms: ${form.platforms.join(', ')}\n`
    }
    if (form.contentType) {
      message += `Content Type: ${form.contentType}\n`
    }
    if (form.instructions) {
      message += `Additional Instructions: ${form.instructions}\n`
    }

    const hasSettings = Object.values(settings).some(v => v.trim().length > 0)
    if (hasSettings) {
      message += '\n--- Brand Guidelines ---\n'
      if (settings.brandVoice) message += `Brand Voice: ${settings.brandVoice}\n`
      if (settings.styleGuidelines) message += `Style Guidelines: ${settings.styleGuidelines}\n`
      if (settings.vocabularyDos) message += `Preferred Vocabulary: ${settings.vocabularyDos}\n`
      if (settings.vocabularyDonts) message += `Avoid These Words: ${settings.vocabularyDonts}\n`
      if (settings.demographics) message += `Target Demographics: ${settings.demographics}\n`
      if (settings.painPoints) message += `Audience Pain Points: ${settings.painPoints}\n`
      if (settings.messagingPreferences) message += `Messaging Preferences: ${settings.messagingPreferences}\n`
      if (settings.seoKeywords) message += `Focus Keywords: ${settings.seoKeywords}\n`
      if (settings.contentPillars) message += `Content Pillars: ${settings.contentPillars}\n`
      if (settings.restrictedLanguage) message += `Restricted Language: ${settings.restrictedLanguage}\n`
    }

    return message
  }, [form, settings])

  const handleGenerateAndPublish = useCallback(async () => {
    if (!form.topic.trim()) {
      setError('Please enter a topic or brief.')
      return
    }
    if (form.platforms.length === 0) {
      setError('Please select at least one platform.')
      return
    }
    if (!form.contentType) {
      setError('Please select a content type.')
      return
    }

    setError(null)
    setSuccessMessage(null)
    setGeneratedContent(null)
    setPublishStatus(null)
    setLoading(true)
    setLoadingPhase('Generating content...')
    setLoadingProgress(10)
    setActiveAgentIdState(CONTENT_ORCHESTRATOR_ID)

    agentActivity.reset()
    agentActivity.setProcessing(true)

    try {
      const message = buildPromptMessage()

      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 2, 45))
      }, 800)

      const orchestratorResult = await callAIAgent(message, CONTENT_ORCHESTRATOR_ID)

      clearInterval(progressInterval)
      setLoadingProgress(50)

      if (orchestratorResult?.session_id) {
        setSessionId(orchestratorResult.session_id)
      }

      if (orchestratorResult?.success && orchestratorResult?.response?.status === 'success') {
        const content: OrchestratorContent = orchestratorResult?.response?.result ?? {}
        setGeneratedContent(content)
        setLoadingPhase('Publishing to platforms...')
        setActiveAgentIdState(PUBLISHER_AGENT_ID)

        const publishInterval = setInterval(() => {
          setLoadingProgress(prev => Math.min(prev + 3, 90))
        }, 600)

        const publishMessage = `Publish the following content:\nTwitter: ${content?.twitter_post ?? 'N/A'}\nInstagram: ${content?.instagram_caption ?? 'N/A'}\nYouTube Shorts: ${content?.youtube_shorts_script ?? 'N/A'}\nFanvue: ${content?.fanvue_post ?? 'N/A'}\nTarget Platforms: ${form.platforms.join(', ')}`

        const publishResult = await callAIAgent(publishMessage, PUBLISHER_AGENT_ID)

        clearInterval(publishInterval)
        setLoadingProgress(100)

        if (publishResult?.session_id) {
          setSessionId(publishResult.session_id)
        }

        let pubStatus: PublishStatus = {}
        if (publishResult?.success && publishResult?.response?.status === 'success') {
          pubStatus = publishResult?.response?.result ?? {}
          setPublishStatus(pubStatus)
          setSuccessMessage(pubStatus?.overall_status ?? 'Content generated and publishing initiated!')
        } else {
          pubStatus = { overall_status: 'Publishing may have encountered issues', errors: [publishResult?.response?.message ?? 'Unknown publishing error'] }
          setPublishStatus(pubStatus)
          setSuccessMessage('Content generated! Publishing status may need review.')
        }

        const historyItem: ContentHistoryItem = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          topic: form.topic,
          contentType: form.contentType,
          platforms: [...form.platforms],
          content,
          publishStatus: pubStatus,
        }
        setHistory(prev => [historyItem, ...prev])
      } else {
        setError(orchestratorResult?.response?.message ?? 'Content generation failed. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
      setLoadingPhase('')
      setLoadingProgress(0)
      setActiveAgentIdState(null)
      agentActivity.setProcessing(false)
    }
  }, [form, buildPromptMessage, agentActivity])

  const togglePlatform = useCallback((platform: string) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }))
  }, [])

  // ─── Computed ──────────────────────────────────────────────────────────────

  const displayHistory = sampleDataOn && history.length === 0 ? SAMPLE_HISTORY : history
  const filteredHistory = displayHistory.filter(item => {
    if (historySearch) {
      const searchLower = historySearch.toLowerCase()
      const topicMatch = (item?.topic ?? '').toLowerCase().includes(searchLower)
      const summaryMatch = (item?.content?.content_summary ?? '').toLowerCase().includes(searchLower)
      if (!topicMatch && !summaryMatch) return false
    }
    if (historyPlatformFilter !== 'all') {
      if (!Array.isArray(item?.platforms) || !item.platforms.some(p => p.toLowerCase().includes(historyPlatformFilter.toLowerCase()))) return false
    }
    if (historyTypeFilter !== 'all') {
      if ((item?.contentType ?? '') !== historyTypeFilter) return false
    }
    return true
  })

  const displayContent = sampleDataOn && !generatedContent ? SAMPLE_CONTENT : generatedContent
  const displayPublishStatus = sampleDataOn && !publishStatus ? SAMPLE_PUBLISH_STATUS : publishStatus
  const recentPublications = displayHistory.slice(0, 5)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ ...THEME_VARS, background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', letterSpacing: '-0.01em', lineHeight: '1.55' } as React.CSSProperties}>
      <SidebarNav
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0" style={{ background: 'hsl(var(--card))' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              {activeScreen === 'dashboard' && 'Dashboard'}
              {activeScreen === 'history' && 'Content History'}
              {activeScreen === 'settings' && 'Brand Settings'}
            </h1>
            {activeAgentIdState && (
              <Badge variant="outline" className="text-xs animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                {AGENTS_INFO.find(a => a.id === activeAgentIdState)?.name ?? 'Processing'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Sample Data</Label>
              <Switch id="sample-toggle" checked={sampleDataOn} onCheckedChange={setSampleDataOn} />
            </div>
            {activeScreen !== 'dashboard' && (
              <Button size="sm" onClick={() => setActiveScreen('dashboard')} style={{ background: 'hsl(var(--primary))', color: 'white' }}>
                <Zap className="h-4 w-4 mr-1" /> New Content
              </Button>
            )}
          </div>
        </header>

        {(error || successMessage || copyStatus) && (
          <div className="px-6 pt-3 shrink-0 space-y-2">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
              </div>
            )}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                <Check className="h-4 w-4 shrink-0" /> {successMessage}
                <button onClick={() => setSuccessMessage(null)} className="ml-auto"><X className="h-4 w-4" /></button>
              </div>
            )}
            {copyStatus && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                <Check className="h-4 w-4 shrink-0" /> {copyStatus}
              </div>
            )}
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* ─── Dashboard Screen ─────────────────────────────────────────── */}
            {activeScreen === 'dashboard' && (
              <div className="flex gap-6 flex-col lg:flex-row">
                <div className="flex-1 lg:w-[60%] space-y-4">
                  <Card className="border-border" style={{ background: 'hsl(var(--card))' }}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                        <Sparkles className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                        Content Requirements
                      </CardTitle>
                      <CardDescription style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Fill in your content brief and let AI generate platform-optimized content.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="topic" className="text-sm font-medium">Topic / Brief *</Label>
                        <Textarea
                          id="topic"
                          placeholder="E.g., Write content about sustainable fashion tips for millennials..."
                          value={sampleDataOn && !form.topic ? 'Sustainable fashion tips for eco-conscious millennials - focus on wardrobe essentials and budget-friendly swaps' : form.topic}
                          onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Target Platforms *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {PLATFORMS.map((platform) => {
                            const isChecked = sampleDataOn && form.platforms.length === 0 ? true : form.platforms.includes(platform)
                            return (
                              <label key={platform} className={cn("flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all duration-200", isChecked ? 'border-2 shadow-sm' : 'border-border hover:border-muted-foreground/30')} style={isChecked ? { borderColor: 'hsl(var(--primary))', background: 'hsl(24 95% 53% / 0.05)' } : {}}>
                                <Checkbox checked={isChecked} onCheckedChange={() => togglePlatform(platform)} />
                                <span className="flex items-center gap-1.5 text-sm">
                                  {getPlatformIcon(platform)} {platform}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Content Type *</Label>
                        <Select value={sampleDataOn && !form.contentType ? 'post' : form.contentType} onValueChange={(val) => setForm(prev => ({ ...prev, contentType: val }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTENT_TYPES.map((ct) => (
                              <SelectItem key={ct} value={ct} className="capitalize">{ct}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="instructions" className="text-sm font-medium">Additional Instructions</Label>
                        <Textarea
                          id="instructions"
                          placeholder="Any specific requirements, tone preferences, or key points to include..."
                          value={sampleDataOn && !form.instructions ? 'Use a conversational, empowering tone. Include actionable tips and a clear CTA.' : form.instructions}
                          onChange={(e) => setForm(prev => ({ ...prev, instructions: e.target.value }))}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full text-sm font-semibold" size="lg" disabled={loading} onClick={handleGenerateAndPublish} style={{ background: 'hsl(var(--primary))', color: 'white' }}>
                        {loading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {loadingPhase}</>
                        ) : (
                          <><Send className="h-4 w-4 mr-2" /> Generate & Publish</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>

                  {loading && (
                    <LoadingOverlay phase={loadingPhase} progress={loadingProgress} />
                  )}

                  {!loading && displayContent && (
                    <ContentResultView content={displayContent} publishStatus={displayPublishStatus ?? null} onCopy={handleCopy} />
                  )}

                  {!loading && !displayContent && (
                    <Card className="border-border border-dashed" style={{ background: 'hsl(var(--card))' }}>
                      <CardContent className="py-12 flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'hsl(24 95% 53% / 0.1)' }}>
                          <Sparkles className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
                        </div>
                        <h3 className="text-base font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Start Creating Content</h3>
                        <p className="text-sm max-w-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Fill in your requirements above to generate and publish across platforms. The AI will handle SEO research, copywriting, and publishing.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="lg:w-[40%] space-y-4">
                  <Card className="border-border" style={{ background: 'hsl(var(--card))' }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                        <Clock className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> Recent Publications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentPublications.length > 0 ? (
                        <div className="space-y-3">
                          {recentPublications.map((item) => (
                            <RecentPublicationCard key={item.id} item={item} onView={() => { setActiveScreen('history') }} />
                          ))}
                          {displayHistory.length > 5 && (
                            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveScreen('history')}>
                              View all {displayHistory.length} entries <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No content published yet</p>
                          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Your recent publications will appear here.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <AgentActivityPanel
                    isConnected={agentActivity.isConnected}
                    events={agentActivity.events}
                    thinkingEvents={agentActivity.thinkingEvents}
                    lastThinkingMessage={agentActivity.lastThinkingMessage}
                    activeAgentId={agentActivity.activeAgentId}
                    activeAgentName={agentActivity.activeAgentName}
                    isProcessing={agentActivity.isProcessing}
                    className="h-auto"
                  />
                </div>
              </div>
            )}

            {/* ─── Content History Screen ───────────────────────────────────── */}
            {activeScreen === 'history' && (
              <div className="space-y-4">
                <Card className="border-border" style={{ background: 'hsl(var(--card))' }}>
                  <CardContent className="py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                          <Input placeholder="Search by topic or keyword..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="pl-9" />
                        </div>
                      </div>
                      <Select value={historyPlatformFilter} onValueChange={setHistoryPlatformFilter}>
                        <SelectTrigger className="w-[160px]">
                          <Filter className="h-4 w-4 mr-1" />
                          <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Platforms</SelectItem>
                          {PLATFORMS.map(p => (
                            <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                        <SelectTrigger className="w-[160px]">
                          <Tag className="h-4 w-4 mr-1" />
                          <SelectValue placeholder="Content Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {CONTENT_TYPES.map(ct => (
                            <SelectItem key={ct} value={ct} className="capitalize">{ct}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {filteredHistory.length > 0 ? (
                  <div className="space-y-3">
                    {filteredHistory.map((item) => (
                      <Card key={item.id} className="border-border hover:shadow-md transition-all duration-200" style={{ background: 'hsl(var(--card))' }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{item?.topic ?? 'Untitled'}</h3>
                                <Badge variant="outline" className="text-xs capitalize">{item?.contentType ?? ''}</Badge>
                              </div>
                              <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {item?.content?.content_summary ?? ''}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                {Array.isArray(item?.platforms) && item.platforms.map((p, i) => {
                                  const status = getPlatformStatus(item?.publishStatus ?? {}, p)
                                  return (
                                    <div key={i} className="flex items-center gap-1.5">
                                      {getPlatformIcon(p)}
                                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p}</span>
                                      {status && <Badge className={cn('text-xs px-1.5 py-0', getStatusColor(status))}>{status}</Badge>}
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(item?.timestamp ?? '')}
                              </div>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0">
                                  <Eye className="h-4 w-4 mr-1" /> View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                                    {item?.topic ?? 'Content Details'}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {formatTimestamp(item?.timestamp ?? '')} | {item?.contentType ?? ''}
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="flex-1 pr-4">
                                  <ContentResultView content={item?.content ?? {}} publishStatus={item?.publishStatus ?? null} onCopy={handleCopy} />
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-border border-dashed" style={{ background: 'hsl(var(--card))' }}>
                    <CardContent className="py-16 flex flex-col items-center text-center">
                      <FileText className="h-12 w-12 mb-4 opacity-20" />
                      <h3 className="text-base font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                        {historySearch || historyPlatformFilter !== 'all' || historyTypeFilter !== 'all' ? 'No matching content found' : 'No content yet'}
                      </h3>
                      <p className="text-sm max-w-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {historySearch || historyPlatformFilter !== 'all' || historyTypeFilter !== 'all'
                          ? 'Try adjusting your filters to see more results.'
                          : 'Generate your first piece of content from the Dashboard to see it here.'}
                      </p>
                      {!(historySearch || historyPlatformFilter !== 'all' || historyTypeFilter !== 'all') && (
                        <Button className="mt-4" onClick={() => setActiveScreen('dashboard')} style={{ background: 'hsl(var(--primary))', color: 'white' }}>
                          <Zap className="h-4 w-4 mr-1" /> Go to Dashboard
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ─── Brand Settings Screen ────────────────────────────────────── */}
            {activeScreen === 'settings' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <Card className="border-border" style={{ background: 'hsl(var(--card))' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                      <Settings className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                      Brand Settings
                    </CardTitle>
                    <CardDescription style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Configure your brand voice, target audience, and content guidelines. These settings will be included in every content generation prompt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" defaultValue={['voice', 'audience', 'seo', 'compliance']} className="w-full">
                      <AccordionItem value="voice">
                        <AccordionTrigger className="text-sm font-semibold">Brand Voice & Tone</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Brand Voice / Tone</Label>
                            <Textarea placeholder="E.g., Friendly, authoritative, witty, conversational..." value={settings.brandVoice} onChange={(e) => setSettings(prev => ({ ...prev, brandVoice: e.target.value }))} rows={2} className="resize-none" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm">Style Guidelines</Label>
                            <Textarea placeholder="E.g., Use short sentences. Prefer active voice. Include data points..." value={settings.styleGuidelines} onChange={(e) => setSettings(prev => ({ ...prev, styleGuidelines: e.target.value }))} rows={2} className="resize-none" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-sm text-green-700">Vocabulary Do&apos;s</Label>
                              <Textarea placeholder="Words and phrases to use..." value={settings.vocabularyDos} onChange={(e) => setSettings(prev => ({ ...prev, vocabularyDos: e.target.value }))} rows={3} className="resize-none" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-sm text-red-700">Vocabulary Don&apos;ts</Label>
                              <Textarea placeholder="Words and phrases to avoid..." value={settings.vocabularyDonts} onChange={(e) => setSettings(prev => ({ ...prev, vocabularyDonts: e.target.value }))} rows={3} className="resize-none" />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="audience">
                        <AccordionTrigger className="text-sm font-semibold">Target Audience</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Demographics</Label>
                            <Textarea placeholder="E.g., Women 25-40, urban professionals, college-educated..." value={settings.demographics} onChange={(e) => setSettings(prev => ({ ...prev, demographics: e.target.value }))} rows={2} className="resize-none" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm">Pain Points</Label>
                            <Textarea placeholder="What problems does your audience face?" value={settings.painPoints} onChange={(e) => setSettings(prev => ({ ...prev, painPoints: e.target.value }))} rows={2} className="resize-none" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm">Messaging Preferences</Label>
                            <Textarea placeholder="How does your audience prefer to be communicated with?" value={settings.messagingPreferences} onChange={(e) => setSettings(prev => ({ ...prev, messagingPreferences: e.target.value }))} rows={2} className="resize-none" />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="seo">
                        <AccordionTrigger className="text-sm font-semibold">SEO & Content Pillars</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Focus Keywords</Label>
                            <Textarea placeholder="Comma-separated keywords: sustainable fashion, eco-friendly, green living..." value={settings.seoKeywords} onChange={(e) => setSettings(prev => ({ ...prev, seoKeywords: e.target.value }))} rows={2} className="resize-none" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm">Content Pillar Categories</Label>
                            <Textarea placeholder="E.g., Education, Inspiration, Product Reviews, Behind-the-Scenes..." value={settings.contentPillars} onChange={(e) => setSettings(prev => ({ ...prev, contentPillars: e.target.value }))} rows={2} className="resize-none" />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="compliance">
                        <AccordionTrigger className="text-sm font-semibold">Compliance & Restrictions</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Restricted Language</Label>
                            <Textarea placeholder="Words, phrases, or topics that must never be used..." value={settings.restrictedLanguage} onChange={(e) => setSettings(prev => ({ ...prev, restrictedLanguage: e.target.value }))} rows={3} className="resize-none" />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div>
                      {settingsSaved && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="h-4 w-4" /> Settings saved successfully
                        </span>
                      )}
                    </div>
                    <Button onClick={saveSettings} style={{ background: 'hsl(var(--primary))', color: 'white' }}>
                      <Check className="h-4 w-4 mr-2" /> Save Settings
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
