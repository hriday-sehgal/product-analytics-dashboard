
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create feature_clicks table
CREATE TABLE public.feature_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all clicks" ON public.feature_clicks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clicks" ON public.feature_clicks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Indexes for analytics queries
CREATE INDEX idx_feature_clicks_feature ON public.feature_clicks(feature_name);
CREATE INDEX idx_feature_clicks_clicked_at ON public.feature_clicks(clicked_at);
CREATE INDEX idx_feature_clicks_user_id ON public.feature_clicks(user_id);
CREATE INDEX idx_profiles_age ON public.profiles(age);
CREATE INDEX idx_profiles_gender ON public.profiles(gender);
