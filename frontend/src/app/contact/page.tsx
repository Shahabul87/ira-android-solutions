'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
  Facebook,
  Twitter,
  Linkedin,
  Github,
  Globe
} from 'lucide-react';
import { translations } from '@/lib/translations';
import {
  FadeInUp,
  ScrollAnimation,
  StaggerContainer,
  StaggerItem,
  HoverScale
} from '@/components/animations/animated-components';

export default function ContactPage(): JSX.Element {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    budget: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        projectType: '',
        budget: '',
        message: ''
      });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'অফিস ঠিকানা',
      details: ['বনানী, ঢাকা - ১২১৩', 'বাংলাদেশ']
    },
    {
      icon: Phone,
      title: 'ফোন নম্বর',
      details: ['+৮৮০ ১৭XX-XXXXXX', '+৮৮০ ১৯XX-XXXXXX']
    },
    {
      icon: Mail,
      title: 'ইমেইল',
      details: ['info@ira-android.com', 'support@ira-android.com']
    },
    {
      icon: Clock,
      title: 'কাজের সময়',
      details: ['রবিবার - বৃহস্পতিবার', 'সকাল ৯টা - সন্ধ্যা ৬টা']
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Globe, href: '#', label: 'Website' }
  ];

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      
      {/* Hero Section */}
      <section className='bg-gradient-to-br from-green-50 via-white to-green-50 pt-24 pb-12'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto text-center'>
            <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              {translations.contact.title}
            </h1>
            <p className='text-xl text-gray-600'>
              {translations.contact.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-6xl mx-auto'>
            <div className='grid lg:grid-cols-3 gap-8'>
              {/* Contact Form */}
              <div className='lg:col-span-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center text-2xl'>
                      <MessageSquare className='h-6 w-6 mr-2 text-green-600' />
                      প্রজেক্ট সম্পর্কে বলুন
                    </CardTitle>
                    <CardDescription>
                      আপনার প্রয়োজন বিস্তারিত জানান, আমরা ২৪ ঘন্টার মধ্যে যোগাযোগ করব
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSubmitted ? (
                      <FadeInUp>
                        <div className='text-center py-12'>
                          <CheckCircle className='h-16 w-16 text-green-600 mx-auto mb-4' />
                          <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                            ধন্যবাদ!
                          </h3>
                          <p className='text-gray-600'>
                            আপনার বার্তা পেয়েছি। শীঘ্রই যোগাযোগ করব।
                          </p>
                        </div>
                      </FadeInUp>
                    ) : (
                      <StaggerContainer>
                        <form onSubmit={handleSubmit} className='space-y-6'>
                        <div className='grid md:grid-cols-2 gap-4'>
                          <div>
                            <Label htmlFor='name'>{translations.contact.form.name} *</Label>
                            <Input
                              id='name'
                              name='name'
                              type='text'
                              required
                              value={formData.name}
                              onChange={handleChange}
                              placeholder='আপনার পূর্ণ নাম'
                              className='mt-1'
                            />
                          </div>
                          <div>
                            <Label htmlFor='email'>{translations.contact.form.email} *</Label>
                            <Input
                              id='email'
                              name='email'
                              type='email'
                              required
                              value={formData.email}
                              onChange={handleChange}
                              placeholder='example@email.com'
                              className='mt-1'
                            />
                          </div>
                        </div>

                        <div className='grid md:grid-cols-2 gap-4'>
                          <div>
                            <Label htmlFor='phone'>{translations.contact.form.phone} *</Label>
                            <Input
                              id='phone'
                              name='phone'
                              type='tel'
                              required
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder='+৮৮০ ১XXX-XXXXXX'
                              className='mt-1'
                            />
                          </div>
                          <div>
                            <Label htmlFor='company'>{translations.contact.form.company}</Label>
                            <Input
                              id='company'
                              name='company'
                              type='text'
                              value={formData.company}
                              onChange={handleChange}
                              placeholder='আপনার কোম্পানির নাম'
                              className='mt-1'
                            />
                          </div>
                        </div>

                        <div className='grid md:grid-cols-2 gap-4'>
                          <div>
                            <Label htmlFor='projectType'>{translations.contact.form.projectType} *</Label>
                            <select
                              id='projectType'
                              name='projectType'
                              required
                              value={formData.projectType}
                              onChange={handleChange}
                              className='w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                            >
                              <option value=''>প্রজেক্ট টাইপ নির্বাচন করুন</option>
                              <option value='new'>নতুন অ্যাপ ডেভেলপমেন্ট</option>
                              <option value='redesign'>অ্যাপ রিডিজাইন</option>
                              <option value='maintenance'>রক্ষণাবেক্ষণ ও সাপোর্ট</option>
                              <option value='consultation'>কনসালটেশন</option>
                              <option value='other'>অন্যান্য</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor='budget'>{translations.contact.form.budget}</Label>
                            <select
                              id='budget'
                              name='budget'
                              value={formData.budget}
                              onChange={handleChange}
                              className='w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                            >
                              <option value=''>বাজেট রেঞ্জ</option>
                              <option value='< 50k'>৫০,০০০ টাকার নিচে</option>
                              <option value='50k-1L'>৫০,০০০ - ১ লাখ</option>
                              <option value='1L-5L'>১ লাখ - ৫ লাখ</option>
                              <option value='5L-10L'>৫ লাখ - ১০ লাখ</option>
                              <option value='> 10L'>১০ লাখের উপরে</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor='message'>{translations.contact.form.message} *</Label>
                          <Textarea
                            id='message'
                            name='message'
                            required
                            value={formData.message}
                            onChange={handleChange}
                            placeholder='আপনার প্রজেক্ট সম্পর্কে বিস্তারিত লিখুন...'
                            className='mt-1 min-h-[150px]'
                          />
                        </div>

                        <Button 
                          type='submit' 
                          disabled={isSubmitting}
                          className='w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                        >
                          {isSubmitting ? (
                            <span className='flex items-center justify-center'>
                              পাঠানো হচ্ছে...
                            </span>
                          ) : (
                            <span className='flex items-center justify-center'>
                              {translations.contact.form.submit}
                              <Send className='ml-2 h-4 w-4' />
                            </span>
                          )}
                        </Button>
                        </form>
                      </StaggerContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className='space-y-6'>
                {/* Contact Info Cards */}
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <Card key={index}>
                      <CardContent className='p-6'>
                        <div className='flex items-start space-x-4'>
                          <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                            <Icon className='h-6 w-6 text-green-600' />
                          </div>
                          <div>
                            <h3 className='font-semibold text-gray-900 mb-1'>
                              {info.title}
                            </h3>
                            {info.details.map((detail, idx) => (
                              <p key={idx} className='text-gray-600 text-sm'>
                                {detail}
                              </p>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Social Links */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>আমাদের ফলো করুন</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='flex space-x-3'>
                      {socialLinks.map((social) => {
                        const Icon = social.icon;
                        return (
                          <a
                            key={social.label}
                            href={social.href}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-green-100 transition-colors group'
                          >
                            <Icon className='h-5 w-5 text-gray-600 group-hover:text-green-600' />
                          </a>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Response */}
                <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
                  <CardContent className='p-6'>
                    <div className='text-center'>
                      <div className='text-4xl mb-3'>⚡</div>
                      <h3 className='font-semibold text-gray-900 mb-2'>
                        দ্রুত রেসপন্স
                      </h3>
                      <p className='text-sm text-gray-600'>
                        আমরা সাধারণত ২৪ ঘন্টার মধ্যে উত্তর দিয়ে থাকি
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <ScrollAnimation>
        <section className='py-20 bg-gray-50'>
          <div className='container mx-auto px-4'>
            <div className='max-w-6xl mx-auto'>
              <FadeInUp>
                <h2 className='text-3xl font-bold text-center text-gray-900 mb-12 animate-fadeIn'>
                  আমাদের অফিস লোকেশন
                </h2>
              </FadeInUp>
              <HoverScale>
                <Card className='overflow-hidden'>
                  <div className='aspect-video bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center'>
                    <FadeInUp>
                      <div className='text-center'>
                        <MapPin className='h-16 w-16 text-green-600 mx-auto mb-4' />
                        <p className='text-gray-700 font-semibold'>বনানী, ঢাকা - ১২১৩</p>
                        <p className='text-gray-600'>বাংলাদেশ</p>
                      </div>
                    </FadeInUp>
                  </div>
                </Card>
              </HoverScale>
            </div>
          </div>
        </section>
      </ScrollAnimation>

      {/* FAQ Section */}
      <ScrollAnimation>
        <section className='py-20'>
          <div className='container mx-auto px-4'>
            <div className='max-w-4xl mx-auto'>
              <FadeInUp>
                <h2 className='text-3xl font-bold text-center text-gray-900 mb-12 animate-fadeIn'>
                  সাধারণ প্রশ্ন
                </h2>
              </FadeInUp>
              <StaggerContainer className='space-y-4'>
                {[
                  {
                    question: 'একটি অ্যাপ তৈরি করতে কত সময় লাগে?',
                    answer: 'সাধারণত একটি মাঝারি আকারের অ্যাপ তৈরি করতে ২-৩ মাস সময় লাগে। তবে এটি প্রজেক্টের জটিলতার উপর নির্ভর করে।'
                  },
                  {
                    question: 'আপনারা কি Play Store এ পাবলিশ করে দেন?',
                    answer: 'হ্যাঁ, আমরা সম্পূর্ণ Play Store পাবলিশিং প্রক্রিয়া পরিচালনা করি, যার মধ্যে ASO অপটিমাইজেশনও রয়েছে।'
                  },
                  {
                    question: 'অ্যাপ তৈরির পর সাপোর্ট পাব?',
                    answer: 'অবশ্যই! আমরা প্রজেক্ট সম্পন্ন হওয়ার পর ৩ মাসের ফ্রি সাপোর্ট প্রদান করি এবং পরবর্তীতে মেইনটেন্যান্স প্যাকেজ অফার করি।'
                  },
                  {
                    question: 'পেমেন্ট কিভাবে করতে হবে?',
                    answer: 'আমরা সাধারণত ৩টি কিস্তিতে পেমেন্ট নিই: ৪০% অগ্রিম, ৪০% ডেভেলপমেন্ট শেষে এবং ২০% ডেলিভারির পর।'
                  }
                ].map((faq, index) => (
                  <StaggerItem key={index}>
                    <HoverScale>
                      <Card>
                        <CardHeader>
                          <CardTitle className='text-lg'>{faq.question}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className='text-gray-600'>{faq.answer}</p>
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

      <Footer />
    </div>
  );
}