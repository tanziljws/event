'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { Mail, Eye, Code } from 'lucide-react'

export default function EmailTemplatesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview')

  // Universal email template (white, simple design)
  const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background-color: #ffffff;
      padding: 40px 30px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e5e5;
    }
    .email-logo {
      font-size: 24px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 10px;
    }
    .email-body {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    .email-title {
      font-size: 24px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .email-content {
      font-size: 16px;
      color: #666666;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    .email-content p {
      margin-bottom: 15px;
    }
    .email-button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #333333;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .email-button:hover {
      background-color: #1a1a1a;
    }
    .email-footer {
      padding: 30px;
      background-color: #f9f9f9;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 14px;
      color: #999999;
    }
    .email-divider {
      height: 1px;
      background-color: #e5e5e5;
      margin: 30px 0;
    }
    .email-info-box {
      background-color: #f9f9f9;
      border-left: 4px solid #333333;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .email-info-box strong {
      color: #333333;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="email-logo">Event Management System</div>
    </div>
    <div class="email-body">
      <h1 class="email-title">Email Title</h1>
      <div class="email-content">
        <p>Hello <strong>John Doe</strong>,</p>
        <p>This is a sample email content. You can customize this template for all your email notifications.</p>
        <div class="email-info-box">
          <p><strong>Sample Information:</strong></p>
          <p>This is an information box that can be used to highlight important details.</p>
        </div>
        <p>Thank you for using our service!</p>
      </div>
      <div style="text-align: center;">
        <a href="#" class="email-button">Action Button</a>
      </div>
    </div>
    <div class="email-footer">
      <p>This is an automated message from Event Management System.</p>
      <p style="margin-top: 10px;">Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `

  const sampleData = {
    title: 'Email Title',
    content: `
      <p>Hello <strong>John Doe</strong>,</p>
      <p>This is a sample email content. You can customize this template for all your email notifications.</p>
      <div class="email-info-box">
        <p><strong>Sample Information:</strong></p>
        <p>This is an information box that can be used to highlight important details.</p>
      </div>
      <p>Thank you for using our service!</p>
    `,
    buttonText: 'Action Button',
    buttonUrl: '#'
  }

  const generatePreview = (title: string, content: string, buttonText: string | null, buttonUrl: string | null) => {
    return emailTemplate
      .replace('Email Title', title)
      .replace('Email Title', title)
      .replace(
        '<div class="email-content">\n        <p>Hello <strong>John Doe</strong>,</p>\n        <p>This is a sample email content. You can customize this template for all your email notifications.</p>\n        <div class="email-info-box">\n          <p><strong>Sample Information:</strong></p>\n          <p>This is an information box that can be used to highlight important details.</p>\n        </div>\n        <p>Thank you for using our service!</p>\n      </div>',
        `<div class="email-content">${content}</div>`
      )
      .replace(
        '<div style="text-align: center;">\n        <a href="#" class="email-button">Action Button</a>\n      </div>',
        buttonText && buttonUrl
          ? `<div style="text-align: center;"><a href="${buttonUrl}" class="email-button">${buttonText}</a></div>`
          : ''
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Universal email template with white, simple design
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={previewMode === 'preview' ? 'default' : 'outline'}
            onClick={() => setPreviewMode('preview')}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={previewMode === 'code' ? 'default' : 'outline'}
            onClick={() => setPreviewMode('code')}
            size="sm"
          >
            <Code className="h-4 w-4 mr-2" />
            Code
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Universal Email Template
          </CardTitle>
          <CardDescription>
            This template is used for all email notifications in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {previewMode === 'preview' ? (
            <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
              <div className="bg-white rounded shadow-sm max-w-2xl mx-auto">
                <iframe
                  srcDoc={generatePreview(sampleData.title, sampleData.content, sampleData.buttonText, sampleData.buttonUrl)}
                  className="w-full h-[600px] border-0"
                  title="Email Preview"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{emailTemplate}</code>
                </pre>
              </div>
              <p className="text-sm text-gray-500">
                This template is automatically used by the Brevo email service for all notifications.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Design</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Clean white background</li>
                <li>Simple, professional layout</li>
                <li>Responsive design</li>
                <li>Mobile-friendly</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Components</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Header with logo</li>
                <li>Title section</li>
                <li>Content area</li>
                <li>Info boxes</li>
                <li>Action buttons</li>
                <li>Footer</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

