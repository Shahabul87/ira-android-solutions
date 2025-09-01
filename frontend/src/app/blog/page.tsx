'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar,
  Clock,
  User,
  Tag,
  Search,
  TrendingUp,
  BookOpen,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { ScrollAnimation, HoverScale } from '@/components/animations/animated-components';

const blogPosts = [
  {
    id: 1,
    title: 'Android 14 এর নতুন ফিচার এবং আপডেট',
    excerpt: 'Android 14 এ যুক্ত হয়েছে অনেক নতুন ফিচার যা ডেভেলপারদের জন্য খুবই উপকারী। এই পোস্টে আমরা আলোচনা করব মূল ফিচারগুলো নিয়ে।',
    content: 'Android 14 নিয়ে এসেছে অনেক এক্সাইটিং ফিচার যা অ্যাপ ডেভেলপমেন্টকে আরও সহজ এবং শক্তিশালী করে তুলেছে...',
    author: 'করিম আহমেদ',
    date: '১৫ মার্চ, ২০২৪',
    readTime: '৫ মিনিট',
    category: 'Technology',
    tags: ['Android', 'Development', 'Updates'],
    image: '📱',
    featured: true,
    comments: 12
  },
  {
    id: 2,
    title: 'Kotlin vs Java: কোনটি বেছে নেবেন?',
    excerpt: 'Android ডেভেলপমেন্টের জন্য Kotlin এবং Java দুটোই জনপ্রিয়। কিন্তু কোনটি আপনার প্রজেক্টের জন্য সবচেয়ে ভালো?',
    content: 'প্রোগ্রামিং ভাষা নির্বাচন একটি গুরুত্বপূর্ণ সিদ্ধান্ত। এই আর্টিকেলে আমরা তুলনা করব...',
    author: 'জাহিদ হাসান',
    date: '১০ মার্চ, ২০২৪',
    readTime: '৮ মিনিট',
    category: 'Programming',
    tags: ['Kotlin', 'Java', 'Comparison'],
    image: '💻',
    featured: false,
    comments: 25
  },
  {
    id: 3,
    title: 'Material Design 3: নতুন ডিজাইন প্যারাডাইম',
    excerpt: 'Material Design 3 এসেছে নতুন কালার সিস্টেম এবং ডায়নামিক থিমিং নিয়ে। জানুন কিভাবে এটি ইমপ্লিমেন্ট করবেন।',
    content: 'Material You নামে পরিচিত Material Design 3 হল Google এর সর্বশেষ ডিজাইন সিস্টেম...',
    author: 'সাদিয়া ইসলাম',
    date: '৫ মার্চ, ২০২৪',
    readTime: '৬ মিনিট',
    category: 'Design',
    tags: ['UI/UX', 'Material Design', 'Android'],
    image: '🎨',
    featured: true,
    comments: 18
  },
  {
    id: 4,
    title: 'App Performance Optimization টিপস',
    excerpt: 'অ্যাপের পারফরম্যান্স ইউজার এক্সপেরিয়েন্সের জন্য খুবই গুরুত্বপূর্ণ। এই ১০টি টিপস ফলো করে আপনার অ্যাপকে করুন সুপার ফাস্ট।',
    content: 'একটি স্মুথ এবং রেসপন্সিভ অ্যাপ তৈরি করা প্রতিটি ডেভেলপারের লক্ষ্য...',
    author: 'নাফিসা আক্তার',
    date: '২৮ ফেব্রুয়ারি, ২০২৪',
    readTime: '১০ মিনিট',
    category: 'Performance',
    tags: ['Optimization', 'Best Practices', 'Tips'],
    image: '⚡',
    featured: false,
    comments: 32
  },
  {
    id: 5,
    title: 'Firebase Integration: সম্পূর্ণ গাইড',
    excerpt: 'Firebase ব্যবহার করে কিভাবে Authentication, Database এবং Cloud Functions ইমপ্লিমেন্ট করবেন তার সম্পূর্ণ গাইড।',
    content: 'Firebase হল Google এর একটি শক্তিশালী প্ল্যাটফর্ম যা অ্যাপ ডেভেলপমেন্টকে সহজ করে...',
    author: 'করিম আহমেদ',
    date: '২০ ফেব্রুয়ারি, ২০২৪',
    readTime: '১২ মিনিট',
    category: 'Backend',
    tags: ['Firebase', 'Cloud', 'Database'],
    image: '🔥',
    featured: true,
    comments: 45
  },
  {
    id: 6,
    title: 'Play Store ASO: অ্যাপ র‍্যাঙ্কিং বাড়ান',
    excerpt: 'Play Store এ আপনার অ্যাপের visibility এবং download বাড়ানোর জন্য ASO (App Store Optimization) এর গুরুত্ব এবং টেকনিক।',
    content: 'App Store Optimization হল আপনার অ্যাপকে Play Store এ খুঁজে পাওয়া সহজ করার প্রক্রিয়া...',
    author: 'ফাতেমা খাতুন',
    date: '১৫ ফেব্রুয়ারি, ২০২৪',
    readTime: '৭ মিনিট',
    category: 'Marketing',
    tags: ['ASO', 'Play Store', 'Marketing'],
    image: '📈',
    featured: false,
    comments: 28
  }
];

const categories = ['All', 'Technology', 'Programming', 'Design', 'Performance', 'Backend', 'Marketing'];

const popularTags = ['Android', 'Kotlin', 'Java', 'Firebase', 'Material Design', 'Performance', 'UI/UX'];

export default function BlogPage(): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      
      {/* Hero Section */}
      <section className='bg-gradient-to-br from-green-50 via-white to-green-50 pt-24 pb-12'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto text-center'>
            <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              আমাদের ব্লগ
            </h1>
            <p className='text-xl text-gray-600 mb-8'>
              Android ডেভেলপমেন্ট, টেকনোলজি এবং ইন্ডাস্ট্রি ইনসাইট
            </p>
            
            {/* Search Bar */}
            <div className='max-w-xl mx-auto relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
              <Input
                type='text'
                placeholder='ব্লগ পোস্ট খুঁজুন...'
                className='pl-10 pr-4 py-3 text-lg border-gray-300 focus:border-green-500'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className='py-8 border-b'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-wrap gap-2 justify-center'>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'border-green-600 text-green-600 hover:bg-green-50'}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div className='container mx-auto px-4 py-12'>
        <div className='grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto'>
          {/* Main Content */}
          <div className='lg:col-span-2'>
            {/* Featured Post */}
            {featuredPosts.length > 0 && selectedCategory === 'All' && !searchQuery && (
              <Card className='mb-8 overflow-hidden border-2 border-green-100'>
                <div className='bg-gradient-to-r from-green-500 to-green-600 text-white p-2 text-center'>
                  <span className='text-sm font-semibold'>✨ ফিচার্ড পোস্ট</span>
                </div>
                <CardHeader>
                  <div className='flex items-center justify-between mb-2'>
                    <Badge className='bg-green-100 text-green-700'>
                      {featuredPosts[0]?.category}
                    </Badge>
                    <div className='flex items-center space-x-4 text-sm text-gray-500'>
                      <span className='flex items-center'>
                        <Calendar className='h-4 w-4 mr-1' />
                        {featuredPosts[0]?.date}
                      </span>
                      <span className='flex items-center'>
                        <Clock className='h-4 w-4 mr-1' />
                        {featuredPosts[0]?.readTime}
                      </span>
                    </div>
                  </div>
                  <CardTitle className='text-2xl mb-3'>
                    <span className='text-4xl mr-3'>{featuredPosts[0]?.image}</span>
                    {featuredPosts[0]?.title}
                  </CardTitle>
                  <CardDescription className='text-base'>
                    {featuredPosts[0]?.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4 text-sm text-gray-600'>
                      <span className='flex items-center'>
                        <User className='h-4 w-4 mr-1' />
                        {featuredPosts[0]?.author}
                      </span>
                      <span className='flex items-center'>
                        <MessageSquare className='h-4 w-4 mr-1' />
                        {featuredPosts[0]?.comments} মন্তব্য
                      </span>
                    </div>
                    <Button size='sm' className='bg-green-600 hover:bg-green-700'>
                      বিস্তারিত পড়ুন
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blog Posts Grid */}
            <div className='grid md:grid-cols-2 gap-6'>
              {filteredPosts.map((post) => (
                <Card key={post.id} className='hover:shadow-lg transition-shadow'>
                  <CardHeader>
                    <div className='flex items-center justify-between mb-2'>
                      <Badge variant='secondary' className='text-xs'>
                        {post.category}
                      </Badge>
                      <span className='text-xs text-gray-500 flex items-center'>
                        <Clock className='h-3 w-3 mr-1' />
                        {post.readTime}
                      </span>
                    </div>
                    <div className='text-3xl mb-3'>{post.image}</div>
                    <CardTitle className='text-lg mb-2 line-clamp-2'>
                      {post.title}
                    </CardTitle>
                    <CardDescription className='line-clamp-3'>
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center space-x-3 text-xs text-gray-500'>
                        <span className='flex items-center'>
                          <Calendar className='h-3 w-3 mr-1' />
                          {post.date}
                        </span>
                        <span className='flex items-center'>
                          <MessageSquare className='h-3 w-3 mr-1' />
                          {post.comments}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>
                        {post.author}
                      </span>
                      <Button size='sm' variant='outline' className='text-green-600 border-green-600 hover:bg-green-50'>
                        পড়ুন →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Popular Posts */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <TrendingUp className='h-5 w-5 mr-2 text-green-600' />
                  জনপ্রিয় পোস্ট
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {blogPosts.slice(0, 3).map((post, index) => (
                    <div key={post.id} className='flex items-start space-x-3'>
                      <span className='text-2xl font-bold text-green-600'>
                        {index + 1}
                      </span>
                      <div className='flex-1'>
                        <h4 className='text-sm font-medium line-clamp-2 hover:text-green-600 cursor-pointer'>
                          {post.title}
                        </h4>
                        <p className='text-xs text-gray-500 mt-1'>{post.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <BookOpen className='h-5 w-5 mr-2 text-green-600' />
                  ক্যাটাগরি
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {categories.slice(1).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className='w-full text-left px-3 py-2 rounded hover:bg-green-50 transition-colors flex justify-between items-center'
                    >
                      <span className='text-sm'>{category}</span>
                      <span className='text-xs text-gray-500'>
                        {blogPosts.filter(p => p.category === category).length}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Tag className='h-5 w-5 mr-2 text-green-600' />
                  জনপ্রিয় ট্যাগ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-2'>
                  {popularTags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant='secondary' 
                      className='cursor-pointer hover:bg-green-100'
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Newsletter */}
            <ScrollAnimation>
              <HoverScale>
                <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
                  <CardHeader>
                    <CardTitle>নিউজলেটার</CardTitle>
                    <CardDescription>
                      সর্বশেষ পোস্ট এবং আপডেট পেতে সাবস্ক্রাইব করুন
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input 
                      type='email' 
                      placeholder='আপনার ইমেইল'
                      className='mb-3'
                    />
                    <HoverScale>
                      <Button className='w-full bg-green-600 hover:bg-green-700'>
                        সাবস্ক্রাইব করুন
                      </Button>
                    </HoverScale>
                  </CardContent>
                </Card>
              </HoverScale>
            </ScrollAnimation>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}