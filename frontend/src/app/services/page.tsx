'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Code2, 
  Smartphone, 
  Cloud, 
  Shield, 
  Rocket,
  CheckCircle,
  ArrowRight,
  Palette,
  Zap,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FadeInUp, ScrollAnimation, StaggerContainer, StaggerItem } from '@/components/animations/animated-components';
import { ParallaxHero, MultiLayerParallax, FloatingElement, ParallaxIcon } from '@/components/animations/parallax-hero';
import { motion } from 'framer-motion';

const servicesData = [
  {
    icon: Code2,
    title: 'কাস্টম অ্যাপ ডেভেলপমেন্ট',
    description: 'আপনার ব্যবসায়িক প্রয়োজন অনুযায়ী সম্পূর্ণ কাস্টমাইজড অ্যান্ড্রয়েড অ্যাপ্লিকেশন',
    features: [
      'Native Android Development (Kotlin/Java)',
      'Cross-platform Solutions (React Native/Flutter)',
      'MVP থেকে এন্টারপ্রাইজ স্কেল',
      'Agile Development Process'
    ],
    price: '৳ ৫০,০০০ থেকে শুরু'
  },
  {
    icon: Palette,
    title: 'UI/UX ডিজাইন',
    description: 'আকর্ষণীয় এবং ইউজার-ফ্রেন্ডলি ইন্টারফেস ডিজাইন Material Design গাইডলাইন অনুসরণ করে',
    features: [
      'Material Design 3 Implementation',
      'User Research & Wireframing',
      'Interactive Prototypes',
      'Usability Testing'
    ],
    price: '৳ ২০,০০০ থেকে শুরু'
  },
  {
    icon: Cloud,
    title: 'API ইন্টিগ্রেশন',
    description: 'তৃতীয় পক্ষের সেবা এবং ব্যাকএন্ড সিস্টেমের সাথে নিরবচ্ছিন্ন সংযোগ',
    features: [
      'RESTful API Integration',
      'GraphQL Implementation',
      'Payment Gateway Integration',
      'Social Media APIs'
    ],
    price: '৳ ১৫,০০০ থেকে শুরু'
  },
  {
    icon: Shield,
    title: 'টেস্টিং ও QA',
    description: 'সম্পূর্ণ অ্যাপ টেস্টিং, বাগ ফিক্সিং এবং পারফরম্যান্স অপটিমাইজেশন',
    features: [
      'Automated Testing',
      'Manual Testing',
      'Performance Testing',
      'Security Audits'
    ],
    price: '৳ ১০,০০০ থেকে শুরু'
  },
  {
    icon: Settings,
    title: 'রক্ষণাবেক্ষণ ও সাপোর্ট',
    description: 'নিয়মিত আপডেট, নিরাপত্তা প্যাচ এবং ২৪/৭ টেকনিক্যাল সাপোর্ট',
    features: [
      'Bug Fixes & Updates',
      'OS Compatibility Updates',
      'Feature Enhancements',
      '24/7 Support'
    ],
    price: '৳ ৫,০০০/মাস থেকে'
  },
  {
    icon: Rocket,
    title: 'প্লে স্টোর ডিপ্লয়মেন্ট',
    description: 'Google Play Store এ অ্যাপ পাবলিশিং এবং ASO (App Store Optimization)',
    features: [
      'Play Store Setup',
      'ASO Optimization',
      'App Description Writing',
      'Screenshot & Graphics Design'
    ],
    price: '৳ ৮,০০০ থেকে শুরু'
  }
];

export default function ServicesPage(): JSX.Element {
  const router = useRouter();

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      
      {/* Hero Section with Parallax */}
      <ParallaxHero className='pt-24 pb-12'>
        <div className='relative'>
          {/* Floating background icons */}
          <ParallaxIcon icon={Code2} size={40} delay={0} className='top-10 left-10 hidden md:block' />
          <ParallaxIcon icon={Smartphone} size={35} delay={0.2} className='top-20 right-20 hidden md:block' />
          <ParallaxIcon icon={Cloud} size={30} delay={0.4} className='bottom-10 left-1/4 hidden md:block' />
          <ParallaxIcon icon={Shield} size={35} delay={0.6} className='bottom-20 right-1/4 hidden md:block' />
          <ParallaxIcon icon={Rocket} size={40} delay={0.8} className='top-1/2 left-20 hidden lg:block' />
          <ParallaxIcon icon={Settings} size={30} delay={1} className='top-1/2 right-20 hidden lg:block' />
          
          <div className='container mx-auto px-4 relative z-10'>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className='max-w-4xl mx-auto text-center'
            >
              {/* Animated badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className='inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-4 py-2 rounded-full mb-6'
              >
                <Zap className='h-4 w-4' />
                <span className='text-sm font-medium'>পূর্ণাঙ্গ সমাধান</span>
              </motion.div>
              
              {/* Main title with gradient */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className='text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-green-800 to-gray-900 bg-clip-text text-transparent'
              >
                আমাদের সেবাসমূহ
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'
              >
                এন্টারপ্রাইজ লেভেল অ্যান্ড্রয়েড অ্যাপ ডেভেলপমেন্টে সম্পূর্ণ সমাধান
              </motion.p>
              
              {/* Animated stats */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className='flex flex-wrap justify-center gap-8 mt-8'
              >
                <FloatingElement delay={0.8}>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-green-600'>১০০+</div>
                    <div className='text-sm text-gray-600'>প্রজেক্ট সম্পন্ন</div>
                  </div>
                </FloatingElement>
                <FloatingElement delay={1}>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-green-600'>৫০+</div>
                    <div className='text-sm text-gray-600'>খুশি ক্লায়েন্ট</div>
                  </div>
                </FloatingElement>
                <FloatingElement delay={1.2}>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-green-600'>২৪/৭</div>
                    <div className='text-sm text-gray-600'>সাপোর্ট</div>
                  </div>
                </FloatingElement>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Multi-layer parallax background */}
          <MultiLayerParallax />
        </div>
      </ParallaxHero>

      {/* Services Grid */}
      <section className='py-20'>
        <div className='container mx-auto px-4'>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <StaggerContainer className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto'>
              {servicesData.map((service, index) => {
                const Icon = service.icon;
                return (
                  <StaggerItem key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 50, rotateX: -30 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      delay: index * 0.1, 
                      duration: 0.6,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ 
                      y: -10, 
                      transition: { duration: 0.3 } 
                    }}
                  >
                  <Card className='hover:shadow-2xl transition-all duration-300 border-gray-100 group h-full overflow-hidden relative'>
                  <CardHeader>
                    <div className='w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                      <Icon className='h-7 w-7 text-white' />
                    </div>
                    <CardTitle className='text-xl mb-2'>{service.title}</CardTitle>
                    <CardDescription className='text-gray-600'>
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2 mb-6'>
                      {service.features.map((feature, idx) => (
                        <li key={idx} className='flex items-start space-x-2'>
                          <CheckCircle className='h-5 w-5 text-green-500 mt-0.5 flex-shrink-0' />
                          <span className='text-sm text-gray-700'>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className='pt-4 border-t'>
                      <p className='text-lg font-semibold text-green-600 mb-4'>
                        {service.price}
                      </p>
                      <Button 
                        className='w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                        onClick={() => router.push('/contact')}
                      >
                        কোটেশন নিন
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <ScrollAnimation>
      <section className='py-20 bg-gray-50'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto'>
            <FadeInUp>
            <h2 className='text-3xl font-bold text-center text-gray-900 mb-12 animate-slideDown'>
              আমাদের কাজের প্রক্রিয়া
            </h2>
            </FadeInUp>
            <StaggerContainer className='space-y-8'>
              {[
                { step: '১', title: 'প্রয়োজন বিশ্লেষণ', desc: 'আপনার ব্যবসায়িক প্রয়োজন এবং লক্ষ্য বুঝে নেওয়া' },
                { step: '২', title: 'ডিজাইন ও প্রোটোটাইপ', desc: 'UI/UX ডিজাইন এবং ইন্টারেক্টিভ প্রোটোটাইপ তৈরি' },
                { step: '৩', title: 'ডেভেলপমেন্ট', desc: 'Agile পদ্ধতিতে অ্যাপ ডেভেলপমেন্ট' },
                { step: '৪', title: 'টেস্টিং', desc: 'সম্পূর্ণ টেস্টিং এবং কোয়ালিটি নিশ্চিতকরণ' },
                { step: '৫', title: 'ডিপ্লয়মেন্ট', desc: 'Play Store এ পাবলিশ এবং লাইভ করা' },
                { step: '৬', title: 'সাপোর্ট', desc: 'নিয়মিত আপডেট এবং রক্ষণাবেক্ষণ' }
              ].map((item, index) => (
                <StaggerItem key={index}>
                <div className='flex items-start space-x-4 hover-grow'>
                  <div className='w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                    {item.step}
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-1'>{item.title}</h3>
                    <p className='text-gray-600'>{item.desc}</p>
                  </div>
                </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>
      </ScrollAnimation>

      {/* CTA Section */}
      <ScrollAnimation>
      <section className='py-20 bg-gradient-to-r from-green-600 to-green-700'>
        <div className='container mx-auto px-4 text-center'>
          <FadeInUp>
          <h2 className='text-3xl font-bold text-white mb-4 animate-slideDown'>
            আপনার প্রজেক্ট শুরু করতে প্রস্তুত?
          </h2>
          <p className='text-xl text-green-50 mb-8 max-w-2xl mx-auto'>
            আমাদের এক্সপার্ট টিমের সাথে আলোচনা করুন এবং আপনার স্বপ্নের অ্যাপ তৈরি করুন
          </p>
          <Button 
            size='lg'
            variant='secondary'
            className='bg-white text-green-600 hover:bg-green-50'
            onClick={() => router.push('/contact')}
          >
            ফ্রি কনসালটেশন বুক করুন
            <ArrowRight className='ml-2 h-5 w-5' />
          </Button>
          </FadeInUp>
        </div>
      </section>
      </ScrollAnimation>

      <Footer />
    </div>
  );
}