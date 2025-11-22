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
  AlertCircle
} from 'lucide-react';
import { ApiService } from '@/lib/api';

type OrganizerType = 'INDIVIDUAL' | 'COMMUNITY' | 'SMALL_BUSINESS' | 'INSTITUTION';

interface FormData {
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

export default function UpgradeBusinessPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    organizerType: 'INDIVIDUAL'
  });
  const [documents, setDocuments] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/upgrade-business');
    } else if (!isLoading && user?.role === 'ORGANIZER') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('documents', file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/upload/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
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
      return !!formData.organizerType;
    }
    
    if (step === 2) {
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
    
    if (step === 3) {
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
    if (!validateStep(3)) {
      setError('Mohon lengkapi semua data dan upload dokumen');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        organizerType: formData.organizerType,
        documents: documents
      };

      // Add fields based on organizer type
      if (formData.organizerType === 'INDIVIDUAL') {
        payload.nik = formData.nik;
        payload.personalAddress = formData.personalAddress;
        payload.personalPhone = formData.personalPhone;
      } else if (formData.organizerType === 'COMMUNITY') {
        payload.communityName = formData.communityName;
        payload.communityAddress = formData.communityAddress;
        payload.communityPhone = formData.communityPhone;
        payload.contactPerson = formData.contactPerson;
      } else if (formData.organizerType === 'SMALL_BUSINESS') {
        payload.businessName = formData.businessName;
        payload.businessAddress = formData.businessAddress;
        payload.businessPhone = formData.businessPhone;
        if (formData.npwp) payload.npwp = formData.npwp;
      } else if (formData.organizerType === 'INSTITUTION') {
        payload.institutionName = formData.institutionName;
        payload.institutionAddress = formData.institutionAddress;
        payload.institutionPhone = formData.institutionPhone;
        payload.contactPerson = formData.contactPerson;
      }

      const response = await ApiService.upgradeToBusiness(payload);
      
      if (response.success) {
        router.push('/dashboard?upgrade=success');
      } else {
        setError(response.message || 'Gagal mengajukan upgrade');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      setError(error.response?.data?.message || 'Gagal mengajukan upgrade');
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

  if (!isAuthenticated || user?.role === 'ORGANIZER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/pricing" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Harga
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Upgrade ke Akun Organizer
          </h1>
          <p className="text-gray-600">
            Lengkapi informasi untuk menjadi organizer dan mulai membuat event
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
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
                    {step === 1 ? 'Tipe Organizer' : step === 2 ? 'Informasi' : 'Dokumen'}
                  </span>
                </div>
                {step < 3 && (
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

        {/* Step 1: Select Organizer Type */}
        {currentStep === 1 && (
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

        {/* Step 2: Fill Information */}
        {currentStep === 2 && (
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

        {/* Step 3: Upload Documents */}
        {currentStep === 3 && (
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
          {currentStep < 3 ? (
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
                  Mengirim...
                </>
              ) : (
                'Ajukan Upgrade'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
