-- Migration: 015_v5_support_tickets.sql
-- Create support_tickets table for production Student <-> Admin communication platform

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN (
    'Bug Report',
    'Feature Request',
    'Question Correction',
    'AI Feedback',
    'Technical Issue',
    'Account Issue',
    'Coding Platform',
    'Learning Platform',
    'Interview Platform',
    'Payment',
    'Other'
  )),
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Pending Student', 'Resolved', 'Closed', 'Archived')),
  admin_notes TEXT,
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast admin dashboard filtering
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(student_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
