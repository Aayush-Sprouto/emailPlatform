import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  Copy,
  Star,
  Mail,
  ShoppingBag,
  Briefcase,
  Heart,
  TrendingUp,
  Users,
  Calendar,
  Gift
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Built-in Professional Templates
const professionalTemplates = [
  {
    id: 'welcome-saas',
    name: 'SaaS Welcome',
    category: 'Onboarding',
    industry: 'Technology',
    icon: Briefcase,
    description: 'Welcome new users to your SaaS platform',
    subject: 'Welcome to {{company_name}} - Let\'s get started!',
    html_content: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to {{company_name}}!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">We're excited to have you on board</p>
          </div>
          <div style="background: white; padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Hi {{first_name}},</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Thank you for joining {{company_name}}! We're here to help you get the most out of our platform.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Quick Start Guide:</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li>Complete your profile setup</li>
                <li>Explore our key features</li>
                <li>Connect with your team</li>
                <li>Schedule a demo call</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Get Started</a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">Questions? Reply to this email or visit our <a href="#" style="color: #3b82f6;">help center</a>.</p>
          </div>
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">© {{company_name}} | <a href="#" style="color: #6b7280;">Unsubscribe</a></p>
          </div>
        </body>
      </html>
    `,
    variables: ['company_name', 'first_name'],
    preview_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHk9IjAiIHdpZHRoPSIzMDAiIGhlaWdodD0iNjAiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxyZWN0IHk9IjcwIiB4PSIyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IndoaXRlIiByeD0iNCIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDBfbGluZWFyXzFfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMzAwIiB5Mj0iNjAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N0VFQSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRCQTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K'
  },
  {
    id: 'newsletter-tech',
    name: 'Tech Newsletter',
    category: 'Newsletter',
    industry: 'Technology',
    icon: TrendingUp,
    description: 'Weekly technology newsletter template',
    subject: '{{company_name}} Tech Weekly - {{date}}',
    html_content: `
      <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: #1f2937; padding: 30px 20px; text-align: center;">
            <h1 style="color: #60a5fa; margin: 0; font-size: 24px; font-weight: bold;">{{company_name}}</h1>
            <p style="color: #d1d5db; margin: 10px 0 0 0; font-size: 14px;">TECH WEEKLY DIGEST</p>
          </div>
          <div style="padding: 30px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">This Week's Highlights</h2>
            <div style="border-left: 4px solid #3b82f6; padding-left: 20px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">🚀 Product Updates</h3>
              <p style="color: #4b5563; line-height: 1.6; margin: 0;">{{product_updates}}</p>
            </div>
            <div style="border-left: 4px solid #10b981; padding-left: 20px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">📊 Industry News</h3>
              <p style="color: #4b5563; line-height: 1.6; margin: 0;">{{industry_news}}</p>
            </div>
            <div style="border-left: 4px solid #f59e0b; padding-left: 20px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">💡 Tech Tips</h3>
              <p style="color: #4b5563; line-height: 1.6; margin: 0;">{{tech_tips}}</p>
            </div>
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0;">Featured Resource</h3>
              <a href="#" style="background: #3b82f6; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Read More</a>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">© {{company_name}} | <a href="#" style="color: #6b7280;">Unsubscribe</a> | <a href="#" style="color: #6b7280;">Archive</a></p>
          </div>
        </body>
      </html>
    `,
    variables: ['company_name', 'date', 'product_updates', 'industry_news', 'tech_tips'],
    preview_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB5PSIwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMUYyOTM3Ii8+CjxyZWN0IHk9IjYwIiB4PSIyMCIgd2lkdGg9IjQiIGhlaWdodD0iMzAiIGZpbGw9IiMzQjgyRjYiLz4KPHJlY3QgeT0iMTAwIiB4PSIyMCIgd2lkdGg9IjQiIGhlaWdodD0iMzAiIGZpbGw9IiMxMEI5ODEiLz4KPHJlY3QgeT0iMTQwIiB4PSIyMCIgd2lkdGg9IjQiIGhlaWdodD0iMzAiIGZpbGw9IiNGNTlFMEIiLz4KPC9zdmc+Cg=='
  },
  {
    id: 'ecommerce-cart',
    name: 'Abandoned Cart',
    category: 'E-commerce',
    industry: 'Retail',
    icon: ShoppingBag,
    description: 'Recover abandoned shopping carts',
    subject: 'Don\'t forget your items, {{first_name}}!',
    html_content: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: #f59e0b; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">You left something behind!</h1>
          </div>
          <div style="padding: 30px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi {{first_name}},</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">We noticed you left some amazing items in your cart. Don't miss out on these great products!</p>
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0;">Your Cart Items:</h3>
              <div style="border-bottom: 1px solid #f3f4f6; padding: 10px 0; margin: 10px 0;">
                <strong style="color: #1f2937;">{{product_name}}</strong>
                <span style="float: right; color: #059669; font-weight: bold;">{{product_price}}</span>
              </div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{cart_url}}" style="background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Complete Your Purchase</a>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>Limited Time:</strong> Use code SAVE10 for 10% off your order!</p>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">© {{company_name}} | <a href="#" style="color: #6b7280;">Unsubscribe</a></p>
          </div>
        </body>
      </html>
    `,
    variables: ['first_name', 'product_name', 'product_price', 'cart_url', 'company_name'],
    preview_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB5PSIwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjU5RTBCIi8+CjxyZWN0IHk9IjYwIiB4PSIyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI0Y5RkFGQiIgcng9IjQiLz4KPHJlY3QgeT0iMTQwIiB4PSI4MCIgd2lkdGg9IjE0MCIgaGVpZ2h0PSIzMCIgZmlsbD0iIzEwQjk4MSIgcng9IjQiLz4KPC9zdmc+Cg=='
  },
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    category: 'Events',
    industry: 'General',
    icon: Calendar,
    description: 'Professional event invitation template',
    subject: 'You\'re Invited: {{event_name}}',
    html_content: `
      <html>
        <body style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background-color: #fafafa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 32px; font-weight: normal;">You're Invited!</h1>
            <div style="width: 60px; height: 2px; background: rgba(255,255,255,0.5); margin: 20px auto;"></div>
            <h2 style="margin: 20px 0 0 0; font-size: 24px; font-weight: normal;">{{event_name}}</h2>
          </div>
          <div style="background: white; padding: 40px 30px;">
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">Dear {{first_name}},</p>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">We're delighted to invite you to {{event_name}}. Join us for an unforgettable experience!</p>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <div style="display: flex; align-items: center; margin: 15px 0;">
                <strong style="color: #1f2937; width: 80px; display: inline-block;">Date:</strong>
                <span style="color: #4b5563;">{{event_date}}</span>
              </div>
              <div style="display: flex; align-items: center; margin: 15px 0;">
                <strong style="color: #1f2937; width: 80px; display: inline-block;">Time:</strong>
                <span style="color: #4b5563;">{{event_time}}</span>
              </div>
              <div style="display: flex; align-items: center; margin: 15px 0;">
                <strong style="color: #1f2937; width: 80px; display: inline-block;">Venue:</strong>
                <span style="color: #4b5563;">{{event_venue}}</span>
              </div>
              <div style="display: flex; align-items: center; margin: 15px 0;">
                <strong style="color: #1f2937; width: 80px; display: inline-block;">Dress:</strong>
                <span style="color: #4b5563;">{{dress_code}}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="{{rsvp_url}}" style="background: #8b5cf6; color: white; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">RSVP Now</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 30px 0 0 0;">Please RSVP by {{rsvp_deadline}} so we can prepare accordingly.</p>
          </div>
          <div style="background: #1f2937; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© {{company_name}} | {{event_address}}</p>
          </div>
        </body>
      </html>
    `,
    variables: ['first_name', 'event_name', 'event_date', 'event_time', 'event_venue', 'dress_code', 'rsvp_url', 'rsvp_deadline', 'company_name', 'event_address'],
    preview_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkFGQUZBIi8+CjxyZWN0IHk9IjAiIHdpZHRoPSIzMDAiIGhlaWdodD0iNzAiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8yXzIpIi8+CjxyZWN0IHk9IjgwIiB4PSIyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSI4MCIgZmlsbD0iI0Y4RkFGQyIgcng9IjQiLz4KPHJlY3QgeT0iMTcwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjMUYyOTM3Ii8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MF9saW5lYXJfMl8yIiB4MT0iMCIgeTE9IjAiIHgyPSIzMDAiIHkyPSI3MCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjNjY3RUVBIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzc2NEJBMiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo='
  },
  {
    id: 'holiday-promo',
    name: 'Holiday Promotion',
    category: 'Promotional',
    industry: 'Retail',
    icon: Gift,
    description: 'Festive holiday promotion template',
    subject: '🎄 Holiday Special: {{discount}}% Off Everything!',
    html_content: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 20px; text-align: center; position: relative;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎄 Holiday Sale 🎄</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Limited Time Offer</p>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 300px;">
              <h2 style="color: white; margin: 0; font-size: 36px; font-weight: bold;">{{discount}}% OFF</h2>
              <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Everything in store!</p>
            </div>
          </div>
          <div style="background: white; padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; text-align: center;">Dear {{first_name}},</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">The holiday season is here, and we're celebrating with our biggest sale of the year!</p>
            
            <div style="background: #fef2f2; border: 2px dashed #dc2626; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">🎁 PROMO CODE 🎁</h3>
              <div style="background: #dc2626; color: white; padding: 10px 20px; border-radius: 4px; display: inline-block; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px;">{{promo_code}}</div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{shop_url}}" style="background: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Shop Now</a>
            </div>
            
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;"><strong>⏰ Hurry!</strong> This offer expires on {{expiry_date}}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">Share the joy! Forward this email to friends and family.</p>
          </div>
          <div style="background: #0f172a; padding: 20px; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">© {{company_name}} | <a href="#" style="color: #64748b;">Unsubscribe</a> | Happy Holidays! 🎄</p>
          </div>
        </body>
      </html>
    `,
    variables: ['first_name', 'discount', 'promo_code', 'shop_url', 'expiry_date', 'company_name'],
    preview_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMEYxNzJBIi8+CjxyZWN0IHk9IjAiIHdpZHRoPSIzMDAiIGhlaWdodD0iODAiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8zXzMpIi8+CjxyZWN0IHk9IjkwIiB4PSIyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSI4MCIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeT0iMTgwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMEYxNzJBIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MF9saW5lYXJfM18zIiB4MT0iMCIgeTE9IjAiIHgyPSIzMDAiIHkyPSI4MCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjREMyNjI2Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzk5MUIxQiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo='
  }
];

const categories = ['All', 'Onboarding', 'Newsletter', 'E-commerce', 'Events', 'Promotional'];
const industries = ['All', 'Technology', 'Retail', 'Healthcare', 'Finance', 'Education', 'General'];

const TemplateLibrary = () => {
  const { apiKey } = useContext(AuthContext);
  const [userTemplates, setUserTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    if (apiKey) {
      fetchUserTemplates();
    }
  }, [apiKey]);

  const fetchUserTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/templates`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
    setLoading(false);
  };

  const filteredTemplates = professionalTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesIndustry = selectedIndustry === 'All' || template.industry === selectedIndustry;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesIndustry && matchesSearch;
  });

  const useTemplate = async (template) => {
    if (!apiKey) {
      alert('Please configure your API key first');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: template.name,
          subject: template.subject,
          html_content: template.html_content,
          variables: template.variables,
          category: template.category.toLowerCase()
        })
      });
      
      if (response.ok) {
        alert('Template added to your library!');
        fetchUserTemplates();
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  };

  const TemplateCard = ({ template, isUserTemplate = false }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        {template.preview_image ? (
          <img 
            src={template.preview_image} 
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <template.icon className="h-16 w-16 text-gray-400" />
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <template.icon className="h-5 w-5 mr-2 text-blue-600" />
            {template.name}
          </h3>
          {!isUserTemplate && (
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {template.category}
          </span>
          <span className="text-xs text-gray-500">{template.industry}</span>
        </div>
        
        {template.variables && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Variables:</p>
            <div className="flex flex-wrap gap-1">
              {template.variables.slice(0, 3).map((variable) => (
                <span key={variable} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {`{{${variable}}}`}
                </span>
              ))}
              {template.variables.length > 3 && (
                <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={() => setPreviewTemplate(template)}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center text-sm"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </button>
          <button
            onClick={() => useTemplate(template)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
          >
            {isUserTemplate ? (
              <>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Use
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="mr-4">
              <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-900" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
              <p className="text-gray-600">Choose from professional email templates</p>
            </div>
          </div>
          
          <Link
            to="/builder"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Industry Filter */}
          <div>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* User Templates Section */}
            {userTemplates.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Your Templates ({userTemplates.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} isUserTemplate={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Professional Templates Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Professional Templates ({filteredTemplates.length})
              </h2>
              
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-16">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No templates found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">{previewTemplate.name} Preview</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-auto max-h-96">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div 
                  dangerouslySetInnerHTML={{ __html: previewTemplate.html_content }}
                  className="max-w-2xl mx-auto"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  useTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;