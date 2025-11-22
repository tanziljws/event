import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import '../../../shared/services/event_service.dart';
import '../../../core/constants/app_constants.dart';

class ImagePickerWidget extends StatefulWidget {
  final String? currentImageUrl;
  final Function(String) onImageSelected;
  final Function()? onImageRemoved;
  final String title;
  final String hint;
  final bool isMultiple;
  final List<String>? currentImageUrls;

  const ImagePickerWidget({
    super.key,
    this.currentImageUrl,
    required this.onImageSelected,
    this.onImageRemoved,
    required this.title,
    required this.hint,
    this.isMultiple = false,
    this.currentImageUrls,
  });

  @override
  State<ImagePickerWidget> createState() => _ImagePickerWidgetState();
}

class _ImagePickerWidgetState extends State<ImagePickerWidget> {
  final ImagePicker _picker = ImagePicker();
  final EventService _eventService = EventService();
  bool _isUploading = false;

  Future<void> _pickImage() async {
    try {
      // Check storage permission first
      final PermissionStatus status = await Permission.photos.request();
      if (status != PermissionStatus.granted) {
        throw Exception('Storage permission denied');
      }
      
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _isUploading = true;
        });

        // Upload to server
        final uploadResult = await _eventService.uploadEventImage(
          filePath: image.path,
          eventId: 'temp', // Will be replaced with actual event ID
          type: 'thumbnail',
        );
        
        if (uploadResult['success'] == true) {
          widget.onImageSelected(uploadResult['imageUrl']);
        } else {
          throw Exception(uploadResult['message'] ?? 'Upload failed');
        }
        
        setState(() {
          _isUploading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isUploading = false;
      });
      
      // Show more user-friendly error message
      String errorMessage = 'Failed to upload image';
      if (e.toString().contains('Network error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (e.toString().contains('permission')) {
        errorMessage = 'Permission denied. Please allow access to photos in settings.';
      } else if (e.toString().contains('file not found')) {
        errorMessage = 'Image file not found. Please try selecting the image again.';
      } else {
        errorMessage = e.toString().replaceAll('Exception: ', '');
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  Future<void> _pickMultipleImages() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (images.isNotEmpty) {
        setState(() {
          _isUploading = true;
        });

        // Upload each image to server
        for (final image in images) {
          final uploadResult = await _eventService.uploadEventImage(
            filePath: image.path,
            eventId: 'temp', // Will be replaced with actual event ID
            type: 'gallery',
          );
          
          if (uploadResult['success'] == true) {
            widget.onImageSelected(uploadResult['imageUrl']);
          } else {
            throw Exception(uploadResult['message'] ?? 'Upload failed');
          }
        }
        
        setState(() {
          _isUploading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isUploading = false;
      });
      
      // Show more user-friendly error message
      String errorMessage = 'Failed to upload images';
      if (e.toString().contains('Network error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (e.toString().contains('permission')) {
        errorMessage = 'Permission denied. Please allow access to photos in settings.';
      } else if (e.toString().contains('file not found')) {
        errorMessage = 'Image file not found. Please try selecting the images again.';
      } else {
        errorMessage = e.toString().replaceAll('Exception: ', '');
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  Future<void> _takePicture() async {
    try {
      // Check camera permission first
      final PermissionStatus status = await Permission.camera.request();
      if (status != PermissionStatus.granted) {
        throw Exception('Camera permission denied');
      }
      
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _isUploading = true;
        });

        // Upload to server
        final uploadResult = await _eventService.uploadEventImage(
          filePath: image.path,
          eventId: 'temp', // Will be replaced with actual event ID
          type: 'thumbnail',
        );
        
        if (uploadResult['success'] == true) {
          widget.onImageSelected(uploadResult['imageUrl']);
        } else {
          throw Exception(uploadResult['message'] ?? 'Upload failed');
        }
        
        setState(() {
          _isUploading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isUploading = false;
      });
      
      // Show more user-friendly error message
      String errorMessage = 'Failed to take picture';
      if (e.toString().contains('Network error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (e.toString().contains('permission') || e.toString().contains('Camera permission')) {
        errorMessage = 'Camera permission denied. Please allow camera access in settings.';
      } else if (e.toString().contains('file not found')) {
        errorMessage = 'Image file not found. Please try taking the picture again.';
      } else {
        errorMessage = e.toString().replaceAll('Exception: ', '');
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                if (widget.isMultiple) {
                  _pickMultipleImages();
                } else {
                  _pickImage();
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                _takePicture();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePreview() {
    if (widget.isMultiple && widget.currentImageUrls != null && widget.currentImageUrls!.isNotEmpty) {
      return _buildMultipleImagePreview();
    } else if (widget.currentImageUrl != null && widget.currentImageUrl!.isNotEmpty) {
      return _buildSingleImagePreview();
    }
    return _buildUploadArea();
  }

  Widget _buildSingleImagePreview() {
    return Container(
      width: double.infinity,
      height: 250,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: widget.currentImageUrl!.startsWith('http')
                ? Image.network(
                    widget.currentImageUrl!,
                    width: double.infinity,
                    height: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[200],
                        child: const Center(
                          child: Icon(Icons.error, size: 48, color: Colors.grey),
                        ),
                      );
                    },
                  )
                : _buildImageWidget(widget.currentImageUrl!),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 20),
                onPressed: widget.onImageRemoved,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMultipleImagePreview() {
    return Container(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: widget.currentImageUrls!.length,
        itemBuilder: (context, index) {
          final imageUrl = widget.currentImageUrls![index];
          return Container(
            width: 120,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: imageUrl.startsWith('http')
                      ? Image.network(
                          imageUrl,
                          width: double.infinity,
                          height: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: Colors.grey[200],
                              child: const Center(
                                child: Icon(Icons.error, size: 24, color: Colors.grey),
                              ),
                            );
                          },
                        )
                      : _buildImageWidget(imageUrl),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 16),
                      onPressed: () {
                        // Remove image logic would go here
                      },
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildUploadArea() {
    return GestureDetector(
      onTap: _isUploading ? null : _showImageSourceDialog,
      child: Container(
        width: double.infinity,
        height: 250,
        decoration: BoxDecoration(
          border: Border.all(
            color: Colors.grey[300]!,
            style: BorderStyle.solid,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: _isUploading
            ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Uploading...'),
                  ],
                ),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    widget.isMultiple ? Icons.photo_library : Icons.add_photo_alternate,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    widget.hint,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'PNG, JPG, GIF up to 5MB',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        _buildImagePreview(),
        const SizedBox(height: 8),
        if (!widget.isMultiple && (widget.currentImageUrl == null || widget.currentImageUrl!.isEmpty))
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isUploading ? null : _showImageSourceDialog,
                  icon: const Icon(Icons.upload),
                  label: const Text('Upload Image'),
                ),
              ),
            ],
          )
        else if (widget.isMultiple)
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isUploading ? null : _showImageSourceDialog,
                  icon: const Icon(Icons.add_photo_alternate),
                  label: const Text('Add More Images'),
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildImageWidget(String imageUrl) {
    // Check if it's a network URL
    if (imageUrl.startsWith('http')) {
      // Network image
      return Image.network(
        imageUrl,
        width: double.infinity,
        height: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            color: Colors.grey[200],
            child: const Center(
              child: Icon(Icons.error, size: 48, color: Colors.grey),
            ),
          );
        },
      );
    } else if (imageUrl.startsWith('/uploads/')) {
      // Server path - convert to full URL using fileBaseUrl
      final fullUrl = '${AppConstants.fileBaseUrl}$imageUrl';
      return Image.network(
        fullUrl,
        width: double.infinity,
        height: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            color: Colors.grey[200],
            child: const Center(
              child: Icon(Icons.error, size: 48, color: Colors.grey),
            ),
          );
        },
      );
    } else {
      // Local file - check if it exists first
      try {
        final file = File(imageUrl);
        if (file.existsSync()) {
          return Image.file(
            file,
            width: double.infinity,
            height: double.infinity,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                color: Colors.grey[200],
                child: const Center(
                  child: Icon(Icons.error, size: 48, color: Colors.grey),
                ),
              );
            },
          );
        } else {
          // File doesn't exist, show placeholder
          return Container(
            color: Colors.grey[200],
            child: const Center(
              child: Icon(Icons.image_not_supported, size: 48, color: Colors.grey),
            ),
          );
        }
      } catch (e) {
        // Handle any file access errors
        return Container(
          color: Colors.grey[200],
          child: const Center(
            child: Icon(Icons.error, size: 48, color: Colors.grey),
          ),
        );
      }
    }
  }
}
