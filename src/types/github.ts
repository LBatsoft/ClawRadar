// GitHub 项目数据类型
export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
    avatar_url: string
  }
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  watchers_count: number
  created_at: string
  updated_at: string
  pushed_at: string
  homepage: string | null
  html_url: string
}

// 项目统计趋势
export interface RepoStats {
  repo: GitHubRepo
  stars_7d: number
  stars_14d: number
  stars_30d: number
  stars_90d: number
  contributors_7d: number
  contributors_14d: number
  contributors_30d: number
  commits_7d: number
  commits_14d: number
  commits_30d: number
  trend: 'rising' | 'cooling' | 'stable'
  rank_7d: number
}

// 生态统计
export interface EcosystemStats {
  total_repos: number
  total_stars: number
  stars_growth_7d: number
  stars_growth_percentage_7d: number
  top_rising_repo: string
  updated_at: string
}

// 贡献者统计
export interface Contributor {
  login: string
  avatar_url: string
  commits_7d: number
  repos_contributed: number
  last_commit_date: string
  html_url: string
}

// 时间周期
export type TimePeriod = '7d' | '14d' | '30d' | '90d'

// 排序类型
export type SortType = 'stars' | 'growth' | 'contributors' | 'commits'

// 标签页类型
export type TabType = 'overview' | 'market_share' | 'star_trend' | 'contrib_trend' | 'commit_trend'
