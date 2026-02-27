-- ============================================================
-- IdeaLinked - Supabase Database Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- user_profiles
-- ============================================================
create table if not exists user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  linkedin_url text,
  linkedin_summary text,
  industry text not null default '',
  role text not null default '',
  experience_level text not null default '',
  target_audience text not null default '',
  content_goal text not null default '',
  tone_preference text not null default '',
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- RLS
alter table user_profiles enable row level security;
create policy "Users can read their own profile"
  on user_profiles for select using (auth.uid() = user_id);
create policy "Users can insert their own profile"
  on user_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update their own profile"
  on user_profiles for update using (auth.uid() = user_id);

-- ============================================================
-- subscriptions
-- ============================================================
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  unique(user_id)
);

-- RLS
alter table subscriptions enable row level security;
create policy "Users can read their own subscription"
  on subscriptions for select using (auth.uid() = user_id);
create policy "Service role can manage subscriptions"
  on subscriptions for all using (true);

-- ============================================================
-- usage_logs
-- ============================================================
create table if not exists usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('generate', 'reframe', 'expand')),
  tokens_used integer default 0,
  estimated_cost_usd numeric(10, 6) default 0,
  created_at timestamptz default now()
);

-- Index for fast daily usage queries
create index if not exists idx_usage_logs_user_action_date
  on usage_logs(user_id, action_type, created_at);

-- RLS
alter table usage_logs enable row level security;
create policy "Users can read their own usage"
  on usage_logs for select using (auth.uid() = user_id);
create policy "Service role can insert usage"
  on usage_logs for insert with check (true);

-- ============================================================
-- generated_ideas
-- ============================================================
create table if not exists generated_ideas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hook text not null,
  angle text not null,
  story_direction text not null,
  cta text not null,
  format text not null,
  tone_used text,
  industry_context text,
  created_at timestamptz default now()
);

-- Index for history queries
create index if not exists idx_generated_ideas_user_date
  on generated_ideas(user_id, created_at desc);

-- RLS
alter table generated_ideas enable row level security;
create policy "Users can read their own ideas"
  on generated_ideas for select using (auth.uid() = user_id);
create policy "Service role can insert ideas"
  on generated_ideas for insert with check (true);

-- ============================================================
-- viral_posts (admin-managed reference library for AI)
-- ============================================================
create table if not exists viral_posts (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  category text default 'General',
  tone text default 'Inspirational',
  likes_count integer default 0,
  added_by text default 'admin',
  created_at timestamptz default now()
);

alter table viral_posts enable row level security;
create policy "Anyone can read viral posts"
  on viral_posts for select using (true);
create policy "Service role can manage viral posts"
  on viral_posts for all using (true);
