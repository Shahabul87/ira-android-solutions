'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Target, 
  Award,
  Rocket,
  Heart,
  Shield,
  ArrowRight,
  Building,
  Clock,
  Globe,
  Briefcase
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FadeInUp, ScrollAnimation, HoverScale, StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/animations/animated-components';

const teamMembers = [
  {
    name: 'মোঃ রহিম উদ্দিন',
    role: 'CEO & Founder',
    experience: '১০+ বছর',
    expertise: 'Business Strategy, Android Architecture',
    image: '👨‍💼'
  },
  {
    name: 'ফাতেমা খাতুন',
    role: 'CTO',
    experience: '৮+ বছর',
    expertise: 'Technical Leadership, System Design',
    image: '👩‍💻'
  },
  {
    name: 'করিম আহমেদ',
    role: 'Lead Android Developer',
    experience: '৬+ বছর',
    expertise: 'Kotlin, Java, Architecture',
    image: '👨‍💻'
  },
  {
    name: 'সাদিয়া ইসলাম',
    role: 'UI/UX Designer',
    experience: '৫+ বছর',
    expertise: 'Material Design, User Research',
    image: '👩‍🎨'
  },
  {
    name: 'জাহিদ হাসান',
    role: 'Backend Developer',
    experience: '৭+ বছর',
    expertise: 'API Development, Cloud Services',
    image: '👨‍💼'
  },
  {
    name: 'নাফিসা আক্তার',
    role: 'QA Engineer',
    experience: '৪+ বছর',
    expertise: 'Testing, Automation',
    image: '👩‍🔬'
  }
];

const milestones = [
  { year: '২০১৯', event: 'কোম্পানি প্রতিষ্ঠা', icon: Building },
  { year: '২০২০', event: 'প্রথম ১০টি সফল প্রজেক্ট', icon: Rocket },
  { year: '২০২১', event: '৫০+ ক্লায়েন্ট মাইলস্টোন', icon: Users },
  { year: '২০২২', event: 'আন্তর্জাতিক ক্লায়েন্ট', icon: Globe },
  { year: '২০২৩', event: '১০০+ প্রজেক্ট সম্পন্ন', icon: Award },
  { year: '২০২৪', event: 'এন্টারপ্রাইজ সলিউশন লঞ্চ', icon: Briefcase }
];

export default function AboutPage(): JSX.Element {
  const router = useRouter();

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      
      {/* Hero Section */}
      <section className='bg-gradient-to-br from-green-50 via-white to-green-50 pt-24 pb-12'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto text-center'>
            <FadeInUp>
              <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fadeIn'>
                আমাদের সম্পর্কে
              </h1>
            </FadeInUp>
            <FadeInUp>
              <p className='text-xl text-gray-600 animate-slideDown'>
                বাংলাদেশের শীর্ষস্থানীয় অ্যান্ড্রয়েড অ্যাপ ডেভেলপমেন্ট কোম্পানি
              </p>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <ScrollAnimation>
        <section className='py-20'>
          <div className='container mx-auto px-4'>
            <div className='max-w-5xl mx-auto'>
              <div className='grid md:grid-cols-2 gap-12 items-center'>
                <ScrollAnimation>
                  <div>
                    <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                      আমাদের গল্প
                    </h2>
                    <div className='space-y-4 text-gray-600'>
                      <p>
                        ২০১৯ সালে প্রতিষ্ঠিত, আইরা অ্যান্ড্রয়েড সলিউশনস বাংলাদেশের অন্যতম শীর্ষস্থানীয় 
                        মোবাইল অ্যাপ ডেভেলপমেন্ট কোম্পানি হিসেবে পরিচিত। আমরা শুরু করেছিলাম একটি ছোট 
                        টিম নিয়ে, কিন্তু আমাদের দক্ষতা এবং ডেডিকেশন আমাদের আজকের অবস্থানে নিয়ে এসেছে।
                      </p>
                      <p>
                        আমাদের লক্ষ্য হলো প্রতিটি ব্যবসাকে ডিজিটাল যুগে সফল করতে সাহায্য করা। 
                        আমরা বিশ্বাস করি যে, সঠিক প্রযুক্তি এবং ইনোভেশন যেকোনো ব্যবসাকে নতুন উচ্চতায় নিয়ে যেতে পারে।
                      </p>
                      <p>
                        ৫+ বছরের অভিজ্ঞতা নিয়ে, আমরা ১০০+ সফল প্রজেক্ট সম্পন্ন করেছি এবং ৫০+ খুশি ক্লায়েন্টের 
                        সাথে কাজ করেছি। আমাদের অ্যাপগুলো মিলিয়নেরও বেশি ইউজার ব্যবহার করছে।
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>
                <StaggerContainer className='grid grid-cols-2 gap-4'>
                  <StaggerItem>
                    <HoverScale>
                      <Card className='text-center p-6'>
                        <div className='text-3xl font-bold text-green-600 mb-2'>
                          <AnimatedCounter to={100} />+
                        </div>
                        <p className='text-gray-600'>সফল প্রজেক্ট</p>
                      </Card>
                    </HoverScale>
                  </StaggerItem>
                  <StaggerItem>
                    <HoverScale>
                      <Card className='text-center p-6'>
                        <div className='text-3xl font-bold text-green-600 mb-2'>
                          <AnimatedCounter to={50} />+
                        </div>
                        <p className='text-gray-600'>খুশি ক্লায়েন্ট</p>
                      </Card>
                    </HoverScale>
                  </StaggerItem>
                  <StaggerItem>
                    <HoverScale>
                      <Card className='text-center p-6'>
                        <div className='text-3xl font-bold text-green-600 mb-2'>
                          <AnimatedCounter to={20} />+
                        </div>
                        <p className='text-gray-600'>টিম মেম্বার</p>
                      </Card>
                    </HoverScale>
                  </StaggerItem>
                  <StaggerItem>
                    <HoverScale>
                      <Card className='text-center p-6'>
                        <div className='text-3xl font-bold text-green-600 mb-2'>
                          <AnimatedCounter to={1} />M+
                        </div>
                        <p className='text-gray-600'>অ্যাপ ডাউনলোড</p>
                      </Card>
                    </HoverScale>
                  </StaggerItem>
                </StaggerContainer>
              </div>
            </div>
          </div>
        </section>
      </ScrollAnimation>

      {/* Mission & Vision */}
      <ScrollAnimation>
        <section className='py-20 bg-gray-50'>
          <div className='container mx-auto px-4'>
            <div className='max-w-5xl mx-auto'>
              <StaggerContainer className='grid md:grid-cols-3 gap-8'>
                <StaggerItem>
                  <HoverScale>
                    <Card className='text-center'>
                      <CardHeader>
                        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                          <Target className='h-8 w-8 text-green-600' />
                        </div>
                        <CardTitle>আমাদের মিশন</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-gray-600'>
                          উচ্চ মানের, ইনোভেটিভ এবং ইউজার-ফ্রেন্ডলি মোবাইল সলিউশন প্রদান করে 
                          ব্যবসায়িক সাফল্যে সহায়তা করা।
                        </p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>

                <StaggerItem>
                  <HoverScale>
                    <Card className='text-center'>
                      <CardHeader>
                        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                          <Rocket className='h-8 w-8 text-green-600' />
                        </div>
                        <CardTitle>আমাদের ভিশন</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-gray-600'>
                          দক্ষিণ এশিয়ার শীর্ষস্থানীয় মোবাইল অ্যাপ ডেভেলপমেন্ট কোম্পানি হিসেবে 
                          প্রতিষ্ঠিত হওয়া।
                        </p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>

                <StaggerItem>
                  <HoverScale>
                    <Card className='text-center'>
                      <CardHeader>
                        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                          <Heart className='h-8 w-8 text-green-600' />
                        </div>
                        <CardTitle>আমাদের মূল্যবোধ</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-gray-600'>
                          সততা, উৎকর্ষতা, ইনোভেশন এবং ক্লায়েন্ট সন্তুষ্টিকে সর্বোচ্চ 
                          অগ্রাধিকার দেওয়া।
                        </p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </div>
        </section>
      </ScrollAnimation>

      {/* Team Section */}
      <ScrollAnimation>
        <section className='py-20'>
          <div className='container mx-auto px-4'>
            <div className='max-w-6xl mx-auto'>
              <FadeInUp>
                <h2 className='text-3xl font-bold text-center text-gray-900 mb-12 animate-fadeIn'>
                  আমাদের দক্ষ টিম
                </h2>
              </FadeInUp>
              <StaggerContainer className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {teamMembers.map((member, index) => (
                  <StaggerItem key={index}>
                    <HoverScale>
                      <Card className='hover:shadow-lg transition-shadow'>
                        <CardHeader className='text-center'>
                          <div className='text-6xl mb-4'>{member.image}</div>
                          <CardTitle className='text-lg'>{member.name}</CardTitle>
                          <CardDescription>{member.role}</CardDescription>
                        </CardHeader>
                        <CardContent className='text-center'>
                          <p className='text-sm text-gray-600 mb-2'>
                            <span className='font-semibold'>অভিজ্ঞতা:</span> {member.experience}
                          </p>
                          <p className='text-sm text-gray-600'>
                            <span className='font-semibold'>দক্ষতা:</span> {member.expertise}
                          </p>
                        </CardContent>
                      </Card>
                    </HoverScale>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </section>
      </ScrollAnimation>

      {/* Timeline */}
      <ScrollAnimation>
        <section className='py-20 bg-gray-50'>
          <div className='container mx-auto px-4'>
            <div className='max-w-4xl mx-auto'>
              <FadeInUp>
                <h2 className='text-3xl font-bold text-center text-gray-900 mb-12 animate-fadeIn'>
                  আমাদের যাত্রা
                </h2>
              </FadeInUp>
              <StaggerContainer className='space-y-8'>
                {milestones.map((milestone, index) => {
                  const Icon = milestone.icon;
                  return (
                    <StaggerItem key={index}>
                      <HoverScale>
                        <div className='flex items-center space-x-4'>
                          <div className='flex-shrink-0'>
                            <div className='w-12 h-12 bg-green-600 rounded-full flex items-center justify-center'>
                              <Icon className='h-6 w-6 text-white' />
                            </div>
                          </div>
                          <div className='flex-1 bg-white p-4 rounded-lg shadow'>
                            <div className='flex items-center justify-between'>
                              <h3 className='font-semibold text-gray-900'>{milestone.event}</h3>
                              <span className='text-green-600 font-bold'>{milestone.year}</span>
                            </div>
                          </div>
                        </div>
                      </HoverScale>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </div>
          </div>
        </section>
      </ScrollAnimation>

      {/* Why Choose Us */}
      <ScrollAnimation>
        <section className='py-20'>
          <div className='container mx-auto px-4'>
            <div className='max-w-5xl mx-auto'>
              <FadeInUp>
                <h2 className='text-3xl font-bold text-center text-gray-900 mb-12 animate-fadeIn'>
                  কেন আমাদের বেছে নেবেন?
                </h2>
              </FadeInUp>
              <StaggerContainer className='grid md:grid-cols-2 gap-6'>
                {[
                  { icon: Shield, title: 'নির্ভরযোগ্যতা', desc: '৫+ বছরের অভিজ্ঞতা এবং প্রমাণিত ট্র্যাক রেকর্ড' },
                  { icon: Users, title: 'দক্ষ টিম', desc: 'অভিজ্ঞ ডেভেলপার এবং ডিজাইনার টিম' },
                  { icon: Clock, title: 'সময়মত ডেলিভারি', desc: 'প্রতিশ্রুতি অনুযায়ী সময়ে প্রজেক্ট সম্পন্ন' },
                  { icon: Award, title: 'গুণমান নিশ্চিতকরণ', desc: 'সর্বোচ্চ মানের কোড এবং টেস্টিং' }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <StaggerItem key={index}>
                      <HoverScale>
                        <div className='flex items-start space-x-4'>
                          <div className='flex-shrink-0'>
                            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                              <Icon className='h-6 w-6 text-green-600' />
                            </div>
                          </div>
                          <div>
                            <h3 className='font-semibold text-gray-900 mb-2'>{item.title}</h3>
                            <p className='text-gray-600'>{item.desc}</p>
                          </div>
                        </div>
                      </HoverScale>
                    </StaggerItem>
                  );
                })}
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
              <h2 className='text-3xl font-bold text-white mb-4 animate-fadeIn'>
                আমাদের সাথে কাজ করতে চান?
              </h2>
            </FadeInUp>
            <FadeInUp>
              <p className='text-xl text-green-50 mb-8 max-w-2xl mx-auto animate-slideDown'>
                আপনার প্রজেক্ট নিয়ে আলোচনা করুন এবং দেখুন কিভাবে আমরা সাহায্য করতে পারি
              </p>
            </FadeInUp>
            <FadeInUp>
              <HoverScale>
                <Button 
                  size='lg'
                  variant='secondary'
                  className='bg-white text-green-600 hover:bg-green-50'
                  onClick={() => router.push('/contact')}
                >
                  যোগাযোগ করুন
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Button>
              </HoverScale>
            </FadeInUp>
          </div>
        </section>
      </ScrollAnimation>

      <Footer />
    </div>
  );
}