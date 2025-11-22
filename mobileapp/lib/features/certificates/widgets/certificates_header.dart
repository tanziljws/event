import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';

class CertificatesHeader extends StatelessWidget {
  final VoidCallback onBackPressed;
  final VoidCallback onSearchPressed;
  final TextEditingController? searchController;
  final ValueChanged<String>? onSearchChanged;

  const CertificatesHeader({
    super.key,
    required this.onBackPressed,
    required this.onSearchPressed,
    this.searchController,
    this.onSearchChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 20,
        right: 20,
        bottom: 8,
      ),
      child: Row(
        children: [
          // Back button
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              onPressed: onBackPressed,
              icon: const Icon(Icons.arrow_back_ios_new),
              iconSize: 20,
              color: Colors.black87,
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Search bar
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(25),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                controller: searchController,
                onChanged: onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Search certificates...',
                  hintStyle: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                  ),
                  prefixIcon: Container(
                    padding: const EdgeInsets.all(12),
                    child: Icon(
                      Icons.search_rounded,
                      color: Colors.grey[600],
                      size: 20,
                    ),
                  ),
                  suffixIcon: searchController?.text.isNotEmpty == true
                      ? Container(
                          padding: const EdgeInsets.all(12),
                          child: GestureDetector(
                            onTap: () {
                              searchController?.clear();
                              onSearchChanged?.call('');
                            },
                            child: Icon(
                              Icons.clear_rounded,
                              color: Colors.grey[600],
                              size: 20,
                            ),
                          ),
                        )
                      : Container(
                          padding: const EdgeInsets.all(12),
                          child: GestureDetector(
                            onTap: onSearchPressed,
                            child: Icon(
                              Icons.tune_rounded,
                              color: Colors.grey[600],
                              size: 20,
                            ),
                          ),
                        ),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(
                      color: Colors.grey[200]!,
                      width: 1,
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(
                      color: Colors.grey[200]!,
                      width: 1,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(
                      color: AppConstants.primaryColor,
                      width: 2,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
