'use client';
import React from 'react';

export default function AssessmentHub() {
  const categories = [
    {
      title: "Targeted Practice",
      description: "Hone specific skills through micro-assessments.",
      items: [
        { name: "Topic Quiz", icon: "📌", count: "45 Available", color: "bg-blue-50 text-blue-700" },
        { name: "Lesson Quiz", icon: "📖", count: "12 Available", color: "bg-indigo-50 text-indigo-700" },
        { name: "Module Quiz", icon: "📚", count: "8 Available", color: "bg-purple-50 text-purple-700" },
        { name: "Domain Quiz", icon: "🌐", count: "3 Available", color: "bg-pink-50 text-pink-700" }
      ]
    },
    {
      title: "Placement Readiness",
      description: "Simulate exact company patterns and Online Assessments.",
      items: [
        { name: "Company Mock", icon: "🏢", count: "TCS, Infosys...", color: "bg-emerald-50 text-emerald-700" },
        { name: "Previous Papers", icon: "📄", count: "24 Papers", color: "bg-teal-50 text-teal-700" },
        { name: "OA Simulation", icon: "💻", count: "Strict Timer", color: "bg-cyan-50 text-cyan-700" },
        { name: "Adaptive Quiz", icon: "🧠", count: "AI Driven", color: "bg-sky-50 text-sky-700" }
      ]
    },
    {
      title: "Challenges & Contests",
      description: "Compete globally and maintain your streak.",
      items: [
        { name: "Daily Challenge", icon: "🔥", count: "Active Now", color: "bg-orange-50 text-orange-700" },
        { name: "Weekly Challenge", icon: "🏆", count: "Starts Sunday", color: "bg-amber-50 text-amber-700" },
        { name: "Contest Mode", icon: "⚔️", count: "Global Ranking", color: "bg-red-50 text-red-700" },
        { name: "Faculty Assignment", icon: "📋", count: "2 Pending", color: "bg-stone-50 text-stone-700" }
      ]
    }
  ];

  return (
    <div className="pb-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Assessment Hub</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          From micro-topic quizzes to full-scale TCS NQT simulations. Choose your battlefield.
        </p>
      </div>

      <div className="space-y-12">
        {categories.map(category => (
          <section key={category.title}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{category.description}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.items.map(item => (
                <div key={item.name} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${item.color}`}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">{item.count}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
