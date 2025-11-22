'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  File, 
  X, 
  Loader2, 
  CheckCircle2,
  User,
  Building2,
  Users,
  GraduationCap,
  FileText,
  AlertCircle,
  Mail,
  Lock,
  Phone,
  MapPin,
  GraduationCap as EducationIcon
} from 'lucide-react';

type OrganizerType = 'INDIVIDUAL' | 'COMMUNITY' | 'SMALL_BUSINESS' | 'INSTITUTION';

interface FormData {
  // Basic user info
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  address: string;
  lastEducation: string;
  // Organizer type
  organizerType: OrganizerType;
  // Individual
  nik?: string;
  personalAddress?: string;
  personalPhone?: string;
  // Community
  communityName?: string;
  communityAddress?: string;
  communityPhone?: string;
  contactPerson?: string;
  // Business
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  npwp?: string;
  // Institution
  institutionName?: string;
  institutionAddress?: string;
  institutionPhone?: string;
}

const organizerTypes = [
  {
    value: 'INDIVIDUAL' as OrganizerType,
    label: 'Individual',
    icon: User,
    description: 'Personal organizer',
    requiredDoc: 'KTP/NIK'
  },
  {
    value: 'COMMUNITY' as OrganizerType,
    label: 'Komunitas',
    icon: Users,
    description: 'Community/Organization',
    requiredDoc: 'Surat Keterangan Komunitas'
  },
  {
    value: 'SMALL_BUSINESS' as OrganizerType,
    label: 'UMKM/Bisnis',
    icon: Building2,
    description: 'Small Business',
    requiredDoc: 'NPWP atau SIUP (opsional)'
  },
  {
    value: 'INSTITUTION' as OrganizerType,
    label: 'Institusi',
    icon: GraduationCap,
    description: 'Educational/Government',
    requiredDoc: 'Surat Keterangan Institusi'
  }
];

export default function RegisterOrganizerPage() {
  const { register: registerUser, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    lastEducation: '',
    organizerType: 'INDIVIDUAL'
  });
  const [documents, setDocuments] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      setError('Hanya file PDF yang diperbolehkan');
      return;
    }
    
    if (pdfFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...pdfFiles]);
      setError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadDocuments = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const formDataUpload = new FormData();
      selectedFiles.forEach(file => {
        formDataUpload.append('documents', file);
      });

      // Use public endpoint for registration (no auth required)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/upload/documents/public`, {
        method: 'POST',
        body: formDataUpload
      });

      const data = await response.json();
      
      if (data.success && data.data?.documents) {
        const urls = data.data.documents.map((doc: any) => doc.url);
        setDocuments(prev => [...prev, ...urls]);
        setSelectedFiles([]);
      } else {
        setError('Gagal mengupload dokumen. Silakan coba lagi.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setError('Gagal mengupload dokumen. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return !!(formData.fullName && formData.email && formData.password && 
                formData.confirmPassword && formData.phoneNumber && 
                formData.address && formData.lastEducation &&
                formData.password === formData.confirmPassword);
    }
    
    if (step === 2) {
      return !!formData.organizerType;
    }
    
    if (step === 3) {
      if (formData.organizerType === 'INDIVIDUAL') {
        return !!(formData.nik && formData.personalAddress && formData.personalPhone);
      } else if (formData.organizerType === 'COMMUNITY') {
        return !!(formData.communityName && formData.communityAddress && 
                 formData.communityPhone && formData.contactPerson);
      } else if (formData.organizerType === 'SMALL_BUSINESS') {
        return !!(formData.businessName && formData.businessAddress && formData.businessPhone);
      } else if (formData.organizerType === 'INSTITUTION') {
        return !!(formData.institutionName && formData.institutionAddress && 
                 formData.institutionPhone && formData.contactPerson);
      }
    }
    
    if (step === 4) {
      return documents.length > 0;
    }
    
    return false;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    } else {
      setError('Mohon lengkapi semua field yang wajib diisi');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Mohon lengkapi semua data dan upload dokumen');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const profileData: any = {
        documents: documents
      };

      // Add fields based on organizer type
      if (formData.organizerType === 'INDIVIDUAL') {
        profileData.nik = formData.nik;
        profileData.personalAddress = formData.personalAddress;
        profileData.personalPhone = formData.personalPhone;
      } else if (formData.organizerType === 'COMMUNITY') {
        profileData.communityName = formData.communityName;
        profileData.communityAddress = formData.communityAddress;
        profileData.communityPhone = formData.communityPhone;
        profileData.contactPerson = formData.contactPerson;
      } else if (formData.organizerType === 'SMALL_BUSINESS') {
        profileData.businessName = formData.businessName;
        profileData.businessAddress = formData.businessAddress;
        profileData.businessPhone = formData.businessPhone;
        if (formData.npwp) profileData.npwp = formData.npwp;
      } else if (formData.organizerType === 'INSTITUTION') {
        profileData.institutionName = formData.institutionName;
        profileData.institutionAddress = formData.institutionAddress;
        profileData.institutionPhone = formData.institutionPhone;
        profileData.contactPerson = formData.contactPerson;
      }

      const success = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        lastEducation: formData.lastEducation,
        role: 'ORGANIZER',
        organizerType: formData.organizerType,
        profileData: profileData
      });

      if (success) {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError('Registrasi gagal. Email mungkin sudah digunakan.');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      setError(error.response?.data?.message || 'Gagal melakukan registrasi');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = organizerTypes.find(t => t.value === formData.organizerType);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Daftar sebagai Organizer
          </h1>
          <p className="text-gray-600">
            Buat akun organizer baru dan mulai kelola event Anda
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step ? <CheckCircle2 className="w-6 h-6" /> : step}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Akun' : step === 2 ? 'Tipe' : step === 3 ? 'Info' : 'Dokumen'}
                  </span>
                </div>
                {step < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
            <p className="text-sm text-red-600 flex-1">{error}</p>
          </div>
        )}

        {/* Step 1: Basic Account Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>
                Lengkapi informasi dasar untuk akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="nama@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Masukkan alamat lengkap"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pendidikan Terakhir <span className="text-red-500">*</span>
                </label>
                <Input
                  name="lastEducation"
                  value={formData.lastEducation}
                  onChange={handleInputChange}
                  placeholder="Contoh: S1 Teknik Informatika"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimal 8 karakter"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Ulangi password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">Password tidak cocok</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Organizer Type */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Pilih Tipe Organizer</CardTitle>
              <CardDescription>
                Pilih tipe organizer yang sesuai dengan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organizerTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.organizerType === type.value;
                  
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, organizerType: type.value }))}
                      className={`p-6 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`p-3 rounded-lg ${
                          isSelected ? 'bg-blue-600' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            isSelected ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="font-semibold text-gray-900">{type.label}</h3>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Dokumen: {type.requiredDoc}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Organizer Information */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Informasi {selectedType?.label}</CardTitle>
              <CardDescription>
                Lengkapi informasi sesuai dengan tipe organizer yang dipilih
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.organizerType === 'INDIVIDUAL' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIK/KTP <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="nik"
                      value={formData.nik || ''}
                      onChange={handleInputChange}
                      placeholder="Masukkan NIK/KTP (16 digit)"
                      maxLength={16}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Lengkap <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="personalAddress"
                      value={formData.personalAddress || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Masukkan alamat lengkap"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="personalPhone"
                      value={formData.personalPhone || ''}
                      onChange={handleInputChange}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                </>
              )}

              {formData.organizerType === 'COMMUNITY' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Komunitas <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="communityName"
                      value={formData.communityName || ''}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama komunitas"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Komunitas <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="communityAddress"
                      value={formData.communityAddress || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Masukkan alamat komunitas"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="communityPhone"
                      value={formData.communityPhone || ''}
                      onChange={handleInputChange}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="contactPerson"
                      value={formData.contactPerson || ''}
                      onChange={handleInputChange}
                      placeholder="Nama contact person"
                      required
                    />
                  </div>
                </>
              )}

              {formData.organizerType === 'SMALL_BUSINESS' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Bisnis <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="businessName"
                      value={formData.businessName || ''}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama bisnis"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Usaha <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="businessAddress"
                      value={formData.businessAddress || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Masukkan alamat usaha"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="businessPhone"
                      value={formData.businessPhone || ''}
                      onChange={handleInputChange}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NPWP (Opsional)
                    </label>
                    <Input
                      name="npwp"
                      value={formData.npwp || ''}
                      onChange={handleInputChange}
                      placeholder="Masukkan NPWP jika ada"
                    />
                  </div>
                </>
              )}

              {formData.organizerType === 'INSTITUTION' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Institusi <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="institutionName"
                      value={formData.institutionName || ''}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama institusi"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Institusi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="institutionAddress"
                      value={formData.institutionAddress || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Masukkan alamat institusi"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="institutionPhone"
                      value={formData.institutionPhone || ''}
                      onChange={handleInputChange}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="contactPerson"
                      value={formData.contactPerson || ''}
                      onChange={handleInputChange}
                      placeholder="Nama contact person"
                      required
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Upload Documents */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Dokumen</CardTitle>
              <CardDescription>
                Upload dokumen pendukung dalam format PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Dokumen yang Diperlukan:
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedType?.requiredDoc}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Dokumen PDF <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="document-upload"
                  multiple
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="document-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Klik untuk memilih file PDF atau drag & drop
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Maksimal 10MB per file
                  </span>
                </label>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1">
                        <File className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 p-1 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={handleUploadDocuments}
                    disabled={uploading || selectedFiles.length === 0}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Dokumen
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Uploaded Documents */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Dokumen Terupload:
                  </p>
                  {documents.map((url, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        Dokumen {index + 1}
                      </span>
                      <Badge className="bg-green-600">Uploaded</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Kembali
          </Button>
          {currentStep < 4 ? (
            <Button onClick={handleNext}>
              Lanjut
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || documents.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mendaftar...
                </>
              ) : (
                'Daftar sebagai Organizer'
              )}
            </Button>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Masuk
          </Link>
          {' '}atau{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-700">
            Daftar sebagai Participant
          </Link>
        </div>
      </div>
    </div>
  );
}
