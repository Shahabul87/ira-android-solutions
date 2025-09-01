'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  Star,
  Users,
  Calendar
} from 'lucide-react';
import { FadeInUp, ScrollAnimation, HoverScale, StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/animations/animated-components';

const portfolioProjects = [
  {
    id: 1,
    title: 'ফুড ডেলিভারি অ্যাপ',
    client: 'খাবার এক্সপ্রেস',
    category: 'E-commerce',
    description: 'একটি সম্পূর্ণ ফুড ডেলিভারি সলিউশন যেখানে রিয়েল-টাইম অর্ডার ট্র্যাকিং, পেমেন্ট গেটওয়ে এবং রাইডার ম্যানেজমেন্ট সিস্টেম রয়েছে।',
    image: '/api/placeholder/400/300',
    technologies: ['Kotlin', 'Firebase', 'Google Maps API', 'Stripe'],
    features: [
      'রিয়েল-টাইম অর্ডার ট্র্যাকিং',
      'মাল্টিপল পেমেন্ট অপশন',
      'রাইডার অ্যাপ ইন্টিগ্রেশন',
      'পুশ নোটিফিকেশন'
    ],
    rating: 4.8,
    downloads: '৫০K+',
    completedDate: 'জানুয়ারি ২০২৪',
    playStoreLink: '#',
    demoLink: '#'
  },
  {
    id: 2,
    title: 'ই-লার্নিং প্ল্যাটফর্ম',
    client: 'শিক্ষা বাংলা',
    category: 'Education',
    description: 'ইন্টারেক্টিভ লার্নিং প্ল্যাটফর্ম যেখানে ভিডিও লেকচার, কুইজ, এবং লাইভ ক্লাস ফিচার রয়েছে।',
    image: '/api/placeholder/400/300',
    technologies: ['Java', 'WebRTC', 'SQLite', 'ExoPlayer'],
    features: [
      'অফলাইন ভিডিও ডাউনলোড',
      'লাইভ ক্লাস সাপোর্ট',
      'ইন্টারেক্টিভ কুইজ',
      'প্রোগ্রেস ট্র্যাকিং'
    ],
    rating: 4.9,
    downloads: '১০০K+',
    completedDate: 'মার্চ ২০২৪',
    playStoreLink: '#',
    demoLink: '#'
  },
  {
    id: 3,
    title: 'হেলথ ট্র্যাকার',
    client: 'সুস্থ বাংলাদেশ',
    category: 'Healthcare',
    description: 'ব্যক্তিগত স্বাস্থ্য মনিটরিং অ্যাপ যা ফিটনেস, ডায়েট এবং মেডিকেশন ট্র্যাকিং করে।',
    image: '/api/placeholder/400/300',
    technologies: ['Kotlin', 'Room DB', 'Health Connect API', 'Charts'],
    features: [
      'ফিটনেস ট্র্যাকিং',
      'ডায়েট প্ল্যানার',
      'মেডিকেশন রিমাইন্ডার',
      'হেলথ রিপোর্ট'
    ],
    rating: 4.7,
    downloads: '২৫K+',
    completedDate: 'ফেব্রুয়ারি ২০২৪',
    playStoreLink: '#',
    demoLink: '#'
  },
  {
    id: 4,
    title: 'বাজেট ম্যানেজার',
    client: 'টাকা হিসাব',
    category: 'Finance',
    description: 'পার্সোনাল ফাইন্যান্স ম্যানেজমেন্ট অ্যাপ যা খরচ ট্র্যাকিং এবং বাজেট প্ল্যানিং করে।',
    image: '/api/placeholder/400/300',
    technologies: ['Flutter', 'SQLite', 'Charts', 'Biometric Auth'],
    features: [
      'খরচ ক্যাটাগরাইজেশন',
      'বাজেট অ্যালার্ট',
      'রিপোর্ট জেনারেশন',
      'ডেটা এক্সপোর্ট'
    ],
    rating: 4.6,
    downloads: '৩০K+',
    completedDate: 'ডিসেম্বর ২০২৩',
    playStoreLink: '#',
    demoLink: '#'
  },
  {
    id: 5,
    title: 'সোশ্যাল মিডিয়া অ্যাপ',
    client: 'কানেক্ট বাংলা',
    category: 'Social',
    description: 'লোকাল কমিউনিটি কানেক্টিং প্ল্যাটফর্ম যেখানে চ্যাট, পোস্ট এবং ইভেন্ট ফিচার রয়েছে।',
    image: '/api/placeholder/400/300',
    technologies: ['React Native', 'Firebase', 'Socket.io', 'Redux'],
    features: [
      'রিয়েল-টাইম চ্যাট',
      'স্টোরি ফিচার',
      'ইভেন্ট ক্রিয়েশন',
      'গ্রুপ ফিচার'
    ],
    rating: 4.5,
    downloads: '৭৫K+',
    completedDate: 'নভেম্বর ২০২৩',
    playStoreLink: '#',
    demoLink: '#'
  },
  {
    id: 6,
    title: 'নিউজ অ্যাগ্রিগেটর',
    client: 'দৈনিক সংবাদ',
    category: 'News',
    description: 'বাংলা নিউজ অ্যাগ্রিগেটর যা বিভিন্ন সোর্স থেকে নিউজ সংগ্রহ এবং ক্যাটাগরাইজ করে।',
    image: '/api/placeholder/400/300',
    technologies: ['Kotlin', 'Retrofit', 'Coroutines', 'WorkManager'],
    features: [
      'মাল্টিপল নিউজ সোর্স',
      'অফলাইন রিডিং',
      'পার্সোনালাইজড ফিড',
      'ডার্ক মোড'
    ],
    rating: 4.4,
    downloads: '৪০K+',
    completedDate: 'অক্টোবর ২০২৩',
    playStoreLink: '#',
    demoLink: '#'
  }
];

const categories = ['All', 'E-commerce', 'Education', 'Healthcare', 'Finance', 'Social', 'News'];

export default function PortfolioPage(): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProjects = selectedCategory === 'All' 
    ? portfolioProjects 
    : portfolioProjects.filter(project => project.category === selectedCategory);

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      
      {/* Hero Section */}
      <section className='bg-gradient-to-br from-green-50 via-white to-green-50 pt-24 pb-12'>
        <div className='container mx-auto px-4'>
          <FadeInUp>
          <div className='max-w-4xl mx-auto text-center'>
            <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              আমাদের পোর্টফোলিও
            </h1>
            <p className='text-xl text-gray-600 mb-8'>
              আমাদের সফল প্রজেক্টগুলো দেখুন এবং আমাদের দক্ষতা সম্পর্কে জানুন
            </p>
            
            {/* Category Filter */}
            <StaggerContainer className='flex flex-wrap gap-2 justify-center mt-8'>
              {categories.map((category) => (
                <StaggerItem key={category}>
                  <Button
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'border-green-600 text-green-600 hover:bg-green-50'}
                  >
                    {category}
                  </Button>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
          </FadeInUp>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className='py-20'>
        <div className='container mx-auto px-4'>
          <StaggerContainer className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto'>
            {filteredProjects.map((project) => (
              <StaggerItem key={project.id}>
                <HoverScale>
                  <Card className='hover:shadow-2xl transition-all duration-300 overflow-hidden group h-full'>
                    <div className='aspect-video bg-gradient-to-br from-green-100 to-green-200 relative overflow-hidden'>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='text-center'>
                          <div className='text-6xl mb-2'>📱</div>
                          <Badge className='bg-green-600'>{project.category}</Badge>
                        </div>
                      </div>
                    </div>
                
                <CardHeader>
                  <div className='flex justify-between items-start mb-2'>
                    <CardTitle className='text-xl'>{project.title}</CardTitle>
                    <div className='flex items-center space-x-1'>
                      <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                      <span className='text-sm font-semibold'>{project.rating}</span>
                    </div>
                  </div>
                  <CardDescription className='text-gray-600'>
                    <span className='font-medium'>ক্লায়েন্ট:</span> {project.client}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className='text-sm text-gray-700 mb-4'>
                    {project.description}
                  </p>
                  
                  <div className='space-y-3 mb-4'>
                    <div className='flex items-center space-x-2 text-sm'>
                      <Users className='h-4 w-4 text-green-600' />
                      <span>{project.downloads} ডাউনলোড</span>
                    </div>
                    <div className='flex items-center space-x-2 text-sm'>
                      <Calendar className='h-4 w-4 text-green-600' />
                      <span>{project.completedDate}</span>
                    </div>
                  </div>
                  
                  <div className='mb-4'>
                    <p className='text-sm font-semibold mb-2'>টেকনোলজি:</p>
                    <div className='flex flex-wrap gap-1'>
                      {project.technologies.map((tech, idx) => (
                        <Badge key={idx} variant='secondary' className='text-xs'>
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className='mb-4'>
                    <p className='text-sm font-semibold mb-2'>মূল ফিচার:</p>
                    <ul className='text-sm text-gray-600 space-y-1'>
                      {project.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className='flex items-start'>
                          <span className='text-green-600 mr-2'>•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className='flex gap-2'>
                    <Button 
                      size='sm' 
                      className='flex-1 bg-green-600 hover:bg-green-700'
                    >
                      <Download className='h-4 w-4 mr-1' />
                      Play Store
                    </Button>
                    <Button 
                      size='sm' 
                      variant='outline'
                      className='flex-1 border-green-600 text-green-600 hover:bg-green-50'
                    >
                      <ExternalLink className='h-4 w-4 mr-1' />
                      ডেমো
                    </Button>
                  </div>
                </CardContent>
              </Card>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats Section */}
      <ScrollAnimation>
      <section className='py-20 bg-gradient-to-r from-green-600 to-green-700'>
        <div className='container mx-auto px-4'>
          <StaggerContainer className='grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center text-white'>
            <StaggerItem>
            <div className='hover-grow'>
              <div className='text-4xl font-bold mb-2'>
                <AnimatedCounter to={100} duration={2} />+
              </div>
              <div className='text-green-100'>সম্পন্ন প্রজেক্ট</div>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className='hover-grow'>
              <div className='text-4xl font-bold mb-2'>
                <AnimatedCounter to={50} duration={2} />+
              </div>
              <div className='text-green-100'>খুশি ক্লায়েন্ট</div>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className='hover-grow'>
              <div className='text-4xl font-bold mb-2'>
                <AnimatedCounter to={1} duration={2} />M+
              </div>
              <div className='text-green-100'>টোটাল ডাউনলোড</div>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className='hover-grow'>
              <div className='text-4xl font-bold mb-2'>৪.৭</div>
              <div className='text-green-100'>গড় রেটিং</div>
            </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
      </ScrollAnimation>

      <Footer />
    </div>
  );
}