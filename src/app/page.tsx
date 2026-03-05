'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Star, GitFork, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { fetchAllRepoStats, fetchEcosystemStats, fetchAllContributors } from '@/lib/github-api'
import { RepoStats, EcosystemStats, Contributor, TimePeriod, TabType } from '@/types/github'

export default function DashboardPage() {
  const [stats, setStats] = useState<RepoStats[]>([])
  const [ecosystemStats, setEcosystemStats] = useState<EcosystemStats | null>(null)
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d')
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    loadData()
    // 每5分钟刷新一次
    const interval = setInterval(loadData, 300000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, ecoData, contribData] = await Promise.all([
        fetchAllRepoStats(),
        fetchEcosystemStats(),
        fetchAllContributors(),
      ])
      setStats(statsData)
      setEcosystemStats(ecoData)
      setContributors(contribData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStarsByPeriod = (s: RepoStats, period: TimePeriod) => {
    switch (period) {
      case '7d': return s.stars_7d
      case '14d': return s.stars_14d
      case '30d': return s.stars_30d
      case '90d': return s.stars_90d
    }
  }

  const getContributorsByPeriod = (s: RepoStats, period: TimePeriod) => {
    switch (period) {
      case '7d': return s.contributors_7d
      case '14d': return s.contributors_14d
      case '30d': return s.contributors_30d
      case '90d': return s.contributors_30d
    }
  }

  const getCommitsByPeriod = (s: RepoStats, period: TimePeriod) => {
    switch (period) {
      case '7d': return s.commits_7d
      case '14d': return s.commits_14d
      case '30d': return s.commits_30d
      case '90d': return s.commits_7d // 90天暂用7天数据
    }
  }

  const formatNumber = (num: number) => num.toLocaleString()

  const renderTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  if (loading && stats.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">🐾</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              ClawRadar
            </h1>
            <p className="text-sm text-neutral-400">OpenClaw 生态项目热度追踪</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Ecosystem Stats */}
        {ecosystemStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-2">
                <CardDescription className="text-neutral-400 text-sm">生态总星标</CardDescription>
                <CardTitle className="text-2xl text-orange-400">{formatNumber(ecosystemStats.total_stars)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-2">
                <CardDescription className="text-neutral-400 text-sm">7天增长</CardDescription>
                <CardTitle className="text-2xl text-green-400">+{formatNumber(ecosystemStats.stars_growth_7d)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-2">
                <CardDescription className="text-neutral-400 text-sm">7天增速</CardDescription>
                <CardTitle className="text-2xl">
                  {ecosystemStats.stars_growth_percentage_7d > 0 ? '+' : ''}
                  {ecosystemStats.stars_growth_percentage_7d}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-2">
                <CardDescription className="text-neutral-400 text-sm">上升最快</CardDescription>
                <CardTitle className="text-sm font-medium truncate">
                  {ecosystemStats.top_rising_repo}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsContent value={activeTab}>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>项目排行榜</CardTitle>
                    <CardDescription>
                      Updated {ecosystemStats ? new Date(ecosystemStats.updated_at).toLocaleString('zh-CN') : '刚刚'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {(['7d', '14d', '30d', '90d'] as TimePeriod[]).map((period) => (
                      <button
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          selectedPeriod === period
                            ? 'bg-orange-500 text-white'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                      >
                        {period.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                      <TableHead className="text-neutral-400">#</TableHead>
                      <TableHead className="text-neutral-400">项目</TableHead>
                      <TableHead className="text-neutral-400 text-right">星标增长</TableHead>
                      <TableHead className="text-neutral-400 text-right">活跃贡献者</TableHead>
                      <TableHead className="text-neutral-400 text-right">提交数</TableHead>
                      <TableHead className="text-neutral-400 text-right">总星标</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((stat) => {
                      const stars = getStarsByPeriod(stat, selectedPeriod)
                      const contributors = getContributorsByPeriod(stat, selectedPeriod)
                      const commits = getCommitsByPeriod(stat, selectedPeriod)

                      return (
                        <TableRow key={stat.repo.id} className="border-neutral-800 hover:bg-neutral-800/50">
                          <TableCell className="font-medium text-neutral-300">{stat.rank_7d}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={stat.repo.owner.avatar_url}
                                alt={stat.repo.owner.login}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={stat.repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-orange-400 hover:underline"
                                  >
                                    {stat.repo.name}
                                  </a>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      stat.trend === 'rising'
                                        ? 'border-green-500 text-green-500'
                                        : stat.trend === 'cooling'
                                        ? 'border-yellow-500 text-yellow-500'
                                        : 'border-neutral-600 text-neutral-400'
                                    }`}
                                  >
                                    {stat.trend.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="text-sm text-neutral-500">{stat.repo.language || 'Unknown'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-medium text-neutral-200">+{formatNumber(stars)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Users className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-neutral-200">{formatNumber(contributors)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-neutral-200">
                            {formatNumber(commits)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Star className="w-4 h-4 text-orange-500" />
                              <span className="font-medium text-neutral-200">{formatNumber(stat.repo.stargazers_count)}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contributors */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>活跃贡献者 (7D)</CardTitle>
            <CardDescription>所有项目的Top贡献者</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                  <TableHead className="text-neutral-400">贡献者</TableHead>
                  <TableHead className="text-neutral-400 text-right">提交数</TableHead>
                  <TableHead className="text-neutral-400 text-right">参与项目</TableHead>
                  <TableHead className="text-neutral-400 text-right">最后提交</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributors.slice(0, 20).map((contributor) => (
                  <TableRow key={contributor.login} className="border-neutral-800 hover:bg-neutral-800/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={contributor.avatar_url}
                          alt={contributor.login}
                          className="w-8 h-8 rounded-full"
                        />
                        <a
                          href={contributor.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-orange-400 hover:underline"
                        >
                          {contributor.login}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-neutral-200">
                      {formatNumber(contributor.commits_7d)}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {contributor.repos_contributed}
                    </TableCell>
                    <TableCell className="text-right text-sm text-neutral-500">
                      {new Date(contributor.last_commit_date).toLocaleDateString('zh-CN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
