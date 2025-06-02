'use client';

import React from 'react';
import Layout from '@/components/Layout';
import useAuthStore from '@/hooks/useAuthStore';

const HomePage: React.FC = () => {
  const { isAuthenticated, connectWallet } = useAuthStore();

  const handleGetStarted = async () => {
    if (!isAuthenticated) {
      try {
        await connectWallet();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const features = [
    {
      title: 'Interactive Learning',
      description: 'Learn Stacks blockchain concepts through hands-on quests and real transactions.',
      icon: '🎮',
    },
    {
      title: 'NFT Badges',
      description: 'Earn unique SIP-009 NFT badges as you complete quests and master new skills.',
      icon: '🏆',
    },
    {
      title: 'Real Blockchain',
      description: 'Practice with real Stacks transactions on Testnet, ready for Mainnet.',
      icon: '⛓️',
    },
    {
      title: 'Progressive Difficulty',
      description: 'Start with basics and advance to complex smart contract development.',
      icon: '📈',
    },
  ];

  const stats = [
    { label: 'Active Learners', value: '1,234' },
    { label: 'Quests Available', value: '25' },
    { label: 'NFT Badges', value: '50' },
    { label: 'Completion Rate', value: '89%' },
  ];

  return (
    <Layout title="StacksQuest - Learn Stacks Blockchain">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Master{' '}
            <span className="text-gradient bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Stacks Blockchain
            </span>{' '}
            Through Quests
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Learn Clarity smart contracts, earn NFT badges, and build real blockchain skills 
            through interactive quests on the Stacks network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="btn btn-primary text-lg px-8 py-3"
            >
              {isAuthenticated ? 'Continue Learning' : 'Connect Wallet & Start'}
            </button>
            <button className="btn btn-secondary text-lg px-8 py-3">
              View Quests
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white rounded-2xl shadow-sm mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose StacksQuest?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The most engaging way to learn blockchain development with real-world applications.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start your blockchain journey in three simple steps.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600">
              Connect your Hiro Wallet to get started with Stacks blockchain interactions.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Complete Quests
            </h3>
            <p className="text-gray-600">
              Learn through interactive quests that teach real blockchain concepts and skills.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Earn NFT Badges
            </h3>
            <p className="text-gray-600">
              Collect unique NFT badges that prove your blockchain knowledge and skills.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Start Your Blockchain Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of developers learning Stacks blockchain through StacksQuest.
          </p>
          <button
            onClick={handleGetStarted}
            className="btn btn-primary text-lg px-8 py-3"
          >
            {isAuthenticated ? 'Continue Learning' : 'Get Started Now'}
          </button>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
