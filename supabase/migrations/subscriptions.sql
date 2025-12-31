-- Subscription System Migration
-- Handles Free/Premium plans, Trials, and Stripe Integration

-- 1. Create Subscriptions Table
create table public.subscriptions (
    user_id uuid references auth.users(id) on delete cascade primary key,
    stripe_customer_id text,
    stripe_subscription_id text,
    plan_id text not null check (plan_id in ('free', 'premium_monthly', 'premium_yearly')),
    status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'expired', 'incomplete')),
    trial_start_at timestamptz,
    trial_ends_at timestamptz,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.subscriptions enable row level security;

-- 3. Policies
-- Users can view their own subscription
create policy "Users can view own subscription"
    on public.subscriptions for select
    using (auth.uid() = user_id);

-- Only Service Role (Edge Functions/Webhooks) can insert/update
-- But we allow a specific RPC for starting trials (logic handled below)

-- 4. Secure RPC to Start Trial
-- Ensures a user can only start a trial ONCE
create or replace function public.start_trial()
returns json
language plpgsql
security definer
as $$
declare
    v_user_id uuid := auth.uid();
    v_exists boolean;
begin
    -- Check if subscription record already exists
    select exists(select 1 from public.subscriptions where user_id = v_user_id)
    into v_exists;

    if v_exists then
        return json_build_object('success', false, 'message', 'Trial already used or active');
    end if;

    -- Create new trial subscription (7 days)
    insert into public.subscriptions (
        user_id,
        plan_id,
        status,
        trial_start_at,
        trial_ends_at
    ) values (
        v_user_id,
        'premium_monthly', -- Default to monthly view, but status is what matters
        'trialing',
        now(),
        now() + interval '7 days'
    );

    return json_build_object('success', true, 'trial_ends_at', now() + interval '7 days');
end;
$$;

-- 5. Helper Check Status Function (Optional, for cleanup)
create or replace function public.check_subscription_status(user_id uuid)
returns text
language sql
security definer
as $$
    select status from public.subscriptions where user_id = $1;
$$;
