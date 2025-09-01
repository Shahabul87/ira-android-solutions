'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { translations } from '@/lib/translations';
import { 
  ArrowRight, 
  CheckCircle2, 
  Code2, 
  Smartphone, 
  Users, 
  Shield, 
  Rocket,
  Cloud
} from 'lucide-react';
import { GlowingTitle } from '@/components/animations/animated-hero-title';
import { motion } from 'framer-motion';

export default function HomePage(): JSX.Element {
  const { isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      
      {/* Hero Section */}
      <section className='relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50 pt-20 pb-32 animate-fadeIn'>
        <div className='absolute inset-0 bg-grid-pattern opacity-5'></div>
        <div className='container mx-auto px-4 relative z-10'>
          <div className='max-w-5xl mx-auto text-center'>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className='inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6 animate-bounce-slow hover-grow'
            >
              <Smartphone className='h-4 w-4 animate-pulse-slow' />
              <span className='text-sm font-medium'>এন্টারপ্রাইজ অ্যান্ড্রয়েড সলিউশন</span>
            </motion.div>
            
            <GlowingTitle 
              text={translations.hero.title}
              className='text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight'
            />
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className='text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed'
            >
              {translations.hero.subtitle}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className='flex flex-col sm:flex-row gap-4 justify-center'
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size='lg' 
                  className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-6 text-lg'
                  onClick={() => router.push('/contact')}
                >
                  {translations.hero.cta.primary}
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant='outline' 
                  size='lg'
                  className='border-green-600 text-green-600 hover:bg-green-50 px-8 py-6 text-lg'
                  onClick={() => router.push('/portfolio')}
                >
                  {translations.hero.cta.secondary}
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-8 mt-16'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-green-600'>১০০+</div>
                <div className='text-sm text-gray-600 mt-1'>সফল প্রজেক্ট</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-green-600'>৫০+</div>
                <div className='text-sm text-gray-600 mt-1'>খুশি ক্লায়েন্ট</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-green-600'>৫+</div>
                <div className='text-sm text-gray-600 mt-1'>বছরের অভিজ্ঞতা</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-green-600'>২৪/৭</div>
                <div className='text-sm text-gray-600 mt-1'>সাপোর্ট</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className='py-20 bg-white'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              {translations.services.title}
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              {translations.services.subtitle}
            </p>
          </div>
          
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
            <Card className='hover:shadow-xl transition-shadow duration-300 border-gray-100'>
              <CardHeader>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4'>
                  <Code2 className='h-6 w-6 text-green-600' />
                </div>
                <CardTitle className='text-xl'>{translations.services.items.custom.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  {translations.services.items.custom.description}
                </p>
              </CardContent>
            </Card>

            <Card className='hover:shadow-xl transition-shadow duration-300 border-gray-100'>
              <CardHeader>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4'>
                  <Smartphone className='h-6 w-6 text-green-600' />
                </div>
                <CardTitle className='text-xl'>{translations.services.items.uiux.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  {translations.services.items.uiux.description}
                </p>
              </CardContent>
            </Card>

            <Card className='hover:shadow-xl transition-shadow duration-300 border-gray-100'>
              <CardHeader>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4'>
                  <Cloud className='h-6 w-6 text-green-600' />
                </div>
                <CardTitle className='text-xl'>{translations.services.items.api.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  {translations.services.items.api.description}
                </p>
              </CardContent>
            </Card>

            <Card className='hover:shadow-xl transition-shadow duration-300 border-gray-100'>
              <CardHeader>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4'>
                  <Shield className='h-6 w-6 text-green-600' />
                </div>
                <CardTitle className='text-xl'>{translations.services.items.testing.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  {translations.services.items.testing.description}
                </p>
              </CardContent>
            </Card>

            <Card className='hover:shadow-xl transition-shadow duration-300 border-gray-100'>
              <CardHeader>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4'>
                  <Users className='h-6 w-6 text-green-600' />
                </div>
                <CardTitle className='text-xl'>{translations.services.items.maintenance.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  {translations.services.items.maintenance.description}
                </p>
              </CardContent>
            </Card>

            <Card className='hover:shadow-xl transition-shadow duration-300 border-gray-100'>
              <CardHeader>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4'>
                  <Rocket className='h-6 w-6 text-green-600' />
                </div>
                <CardTitle className='text-xl'>{translations.services.items.playstore.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  {translations.services.items.playstore.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className='py-20 bg-gradient-to-b from-gray-50 to-white'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              {translations.features.title}
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              {translations.features.subtitle}
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'>
            {Object.values(translations.features.items).map((feature, index) => (
              <div key={index} className='flex items-start space-x-4'>
                <div className='flex-shrink-0'>
                  <CheckCircle2 className='h-6 w-6 text-green-600 mt-1' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-gray-600'>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className='py-20 bg-white'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              {translations.tech.title}
            </h2>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto'>
            <div className='text-center'>
              <h3 className='font-semibold text-gray-900 mb-4'>{translations.tech.languages}</h3>
              <div className='space-y-2 text-gray-600'>
                <div>Kotlin</div>
                <div>Java</div>
                <div>JavaScript</div>
                <div>TypeScript</div>
              </div>
            </div>
            <div className='text-center'>
              <h3 className='font-semibold text-gray-900 mb-4'>{translations.tech.frameworks}</h3>
              <div className='space-y-2 text-gray-600'>
                <div>Android SDK</div>
                <div>Jetpack Compose</div>
                <div>React Native</div>
                <div>Flutter</div>
              </div>
            </div>
            <div className='text-center'>
              <h3 className='font-semibold text-gray-900 mb-4'>{translations.tech.tools}</h3>
              <div className='space-y-2 text-gray-600'>
                <div>Android Studio</div>
                <div>Git & GitHub</div>
                <div>Firebase</div>
                <div>CI/CD</div>
              </div>
            </div>
            <div className='text-center'>
              <h3 className='font-semibold text-gray-900 mb-4'>{translations.tech.database}</h3>
              <div className='space-y-2 text-gray-600'>
                <div>Room Database</div>
                <div>SQLite</div>
                <div>Firebase Realtime</div>
                <div>MongoDB</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-gradient-to-r from-green-600 to-green-700'>
        <div className='container mx-auto px-4 text-center'>
          <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
            আপনার স্বপ্নের অ্যাপ তৈরি করতে প্রস্তুত?
          </h2>
          <p className='text-xl text-green-50 mb-8 max-w-2xl mx-auto'>
            আজই আমাদের সাথে যোগাযোগ করুন এবং আপনার ব্যবসার জন্য পারফেক্ট অ্যান্ড্রয়েড সলিউশন পান
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button 
              size='lg'
              variant='secondary'
              className='bg-white text-green-600 hover:bg-green-50 px-8 py-6 text-lg'
              onClick={() => router.push('/contact')}
            >
              {translations.cta.startProject}
              <ArrowRight className='ml-2 h-5 w-5' />
            </Button>
            <Button 
              size='lg'
              variant='outline'
              className='border-white text-white hover:bg-white/10 px-8 py-6 text-lg'
              onClick={() => router.push('/portfolio')}
            >
              {translations.cta.viewDemo}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}