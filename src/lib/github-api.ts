import { GitHubRepo, RepoStats, Contributor, EcosystemStats } from '@/types/github'

// 追踪的 OpenClaw 生态项目列表
const TRACKED_REPOS = [
  'openclaw/openclaw',
  'openclaw/agents',
  'openclaw/skills',
  'openclaw/docs',
  'clawhub/skills',
  'openclaw/tooling',
].join(',')

/**
 * 获取 GitHub 仓库信息
 */
export async function fetchRepo(repoName: string): Promise<GitHubRepo> {
  const response = await fetch(`https://api.github.com/repos/${repoName}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
    next: { revalidate: 300 } // 缓存5分钟
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch repo ${repoName}: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取多个仓库信息
 */
export async function fetchRepos(repoNames: string[]): Promise<GitHubRepo[]> {
  const repos = await Promise.all(
    repoNames.map(name => fetchRepo(name).catch(err => {
      console.error(`Failed to fetch ${name}:`, err)
      return null
    }))
  )
  return repos.filter((r): r is GitHubRepo => r !== null)
}

/**
 * 获取仓库贡献者数量（简化版本，不获取完整列表）
 * GitHub API 限制：contributors 列表最多返回30人
 */
export async function fetchContributorsCount(repoName: string): Promise<number> {
  const response = await fetch(
    `https://api.github.com/repos/${repoName}/contributors?per_page=1&anon=1`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    return 0
  }

  // 从 Link header 获取总数
  const linkHeader = response.headers.get('Link')
  if (linkHeader) {
    const match = linkHeader.match(/page=(\d+)>; rel="last"/)
    if (match) {
      return parseInt(match[1], 10)
    }
  }

  // 如果没有分页信息，根据返回的列表长度估算
  const contributors = await response.json()
  return Array.isArray(contributors) ? contributors.length : 0
}

/**
 * 获取仓库活跃贡献者（最近7天）
 */
export async function fetchActiveContributors(repoName: string, days: number = 7): Promise<Contributor[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const response = await fetch(
    `https://api.github.com/repos/${repoName}/commits?since=${since.toISOString()}&per_page=100`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    return []
  }

  const commits = await response.json()
  const contributorMap = new Map<string, Contributor>()

  commits.forEach((commit: any) => {
    const login = commit.author?.login || 'anonymous'
    if (!contributorMap.has(login)) {
      contributorMap.set(login, {
        login,
        avatar_url: commit.author?.avatar_url || `https://github.com/${login}.png?size=40`,
        commits_7d: 1,
        repos_contributed: 1,
        last_commit_date: commit.commit?.committer?.date || new Date().toISOString(),
        html_url: commit.author?.html_url || `https://github.com/${login}`,
      })
    } else {
      const contributor = contributorMap.get(login)!
      contributor.commits_7d++
    }
  })

  return Array.from(contributorMap.values()).sort((a, b) => b.commits_7d - a.commits_7d)
}

/**
 * 模拟历史数据（实际应用需要定时任务收集）
 */
function simulateHistoricalData(repo: GitHubRepo) {
  // 使用随机种子生成一致的"历史"数据
  const seed = repo.id
  const random = (n: number) => ((Math.sin(seed + n) * 10000) % 100) / 100

  const baseStars = repo.stargazers_count

  return {
    stars_7d: Math.max(0, Math.floor(baseStars * 0.02 * (1 + random(1)))),
    stars_14d: Math.max(0, Math.floor(baseStars * 0.035 * (1 + random(2)))),
    stars_30d: Math.max(0, Math.floor(baseStars * 0.06 * (1 + random(3)))),
    stars_90d: Math.max(0, Math.floor(baseStars * 0.12 * (1 + random(4)))),
    contributors_7d: Math.max(1, Math.floor((repo.forks_count / 10) * (1 + random(5)))),
    contributors_14d: Math.max(1, Math.floor((repo.forks_count / 8) * (1 + random(6)))),
    contributors_30d: Math.max(1, Math.floor((repo.forks_count / 6) * (1 + random(7)))),
    commits_7d: Math.max(5, Math.floor((repo.forks_count * 2) * (1 + random(8)))),
    commits_14d: Math.max(10, Math.floor((repo.forks_count * 3.5) * (1 + random(9)))),
    commits_30d: Math.max(20, Math.floor((repo.forks_count * 5) * (1 + random(10)))),
  }
}

/**
 * 计算趋势
 */
function calculateTrend(stats: any): 'rising' | 'cooling' | 'stable' {
  const growth = stats.stars_7d - stats.stars_14d
  if (growth > 0.1 * stats.stars_14d) return 'rising'
  if (growth < -0.05 * stats.stars_14d) return 'cooling'
  return 'stable'
}

/**
 * 获取所有追踪项目的统计数据
 */
export async function fetchAllRepoStats(): Promise<RepoStats[]> {
  const repoNames = TRACKED_REPOS.split(',')
  const repos = await fetchRepos(repoNames)

  const statsList = await Promise.all(
    repos.map(async (repo) => {
      const historical = simulateHistoricalData(repo)
      const trend = calculateTrend(historical)

      return {
        repo,
        ...historical,
        trend,
        rank_7d: 0, // 稍后计算
      }
    })
  )

  // 按星标增长排序并设置排名
  statsList.sort((a, b) => b.stars_7d - a.stars_7d)
  statsList.forEach((stats, index) => {
    stats.rank_7d = index + 1
  })

  return statsList
}

/**
 * 获取生态统计数据
 */
export async function fetchEcosystemStats(): Promise<EcosystemStats> {
  const statsList = await fetchAllRepoStats()

  const totalStars = statsList.reduce((sum, stats) => sum + stats.repo.stargazers_count, 0)
  const starsGrowth7d = statsList.reduce((sum, stats) => sum + stats.stars_7d, 0)
  const starsGrowthPercentage = totalStars > 0 ? (starsGrowth7d / (totalStars - starsGrowth7d)) * 100 : 0

  const topRisingRepo = statsList.find(s => s.trend === 'rising')?.repo.full_name || statsList[0]?.repo.full_name || ''

  return {
    total_repos: statsList.length,
    total_stars: totalStars,
    stars_growth_7d: starsGrowth7d,
    stars_growth_percentage_7d: Math.round(starsGrowthPercentage * 100) / 100,
    top_rising_repo: topRisingRepo,
    updated_at: new Date().toISOString(),
  }
}

/**
 * 获取所有项目的活跃贡献者（合并去重）
 */
export async function fetchAllContributors(): Promise<Contributor[]> {
  const repoNames = TRACKED_REPOS.split(',')
  const allContributors: Contributor[] = []

  for (const repoName of repoNames) {
    const contributors = await fetchActiveContributors(repoName, 7)
    allContributors.push(...contributors)
  }

  // 合并相同用户的贡献
  const contributorMap = new Map<string, Contributor>()
  allContributors.forEach(c => {
    if (!contributorMap.has(c.login)) {
      contributorMap.set(c.login, { ...c })
    } else {
      const existing = contributorMap.get(c.login)!
      existing.commits_7d += c.commits_7d
      existing.repos_contributed += 1
    }
  })

  return Array.from(contributorMap.values())
    .sort((a, b) => b.commits_7d - a.commits_7d)
    .slice(0, 50) // 只返回前50名
}
