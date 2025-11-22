import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/models/ticket_type_model.dart';

class CustomTicketBuilder extends StatefulWidget {
  final TicketType? initialTicket;
  final String eventId;
  final DateTime? eventRegistrationDeadline;
  final Function(TicketType) onTicketCreated;
  final VoidCallback? onCancel;

  const CustomTicketBuilder({
    super.key,
    this.initialTicket,
    required this.eventId,
    this.eventRegistrationDeadline,
    required this.onTicketCreated,
    this.onCancel,
  });

  @override
  State<CustomTicketBuilder> createState() => _CustomTicketBuilderState();
}

class _CustomTicketBuilderState extends State<CustomTicketBuilder> with TickerProviderStateMixin {
  late TicketType _ticket;
  late TabController _tabController;
  
  // Form controllers
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _capacityController = TextEditingController();
  final _minQuantityController = TextEditingController();
  final _maxQuantityController = TextEditingController();
  final _promoCodeController = TextEditingController();
  final _termsController = TextEditingController();
  
  // Form state
  final _formKey = GlobalKey<FormState>();
  List<String> _benefits = [];
  final _benefitController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    
    // Initialize ticket
    _ticket = widget.initialTicket ?? TicketType.createEmpty(widget.eventId);
    
    // Auto-fill sale end date from event registration deadline
    if (_ticket.saleEndDate == null && widget.eventRegistrationDeadline != null) {
      // Set to end of day (23:59:59) so users can register until end of deadline day
      final endOfDay = DateTime(
        widget.eventRegistrationDeadline!.year,
        widget.eventRegistrationDeadline!.month,
        widget.eventRegistrationDeadline!.day,
        23, 59, 59
      );
      _ticket = _ticket.copyWith(saleEndDate: endOfDay);
    }
    
    // Initialize controllers
    _nameController.text = _ticket.name;
    _descriptionController.text = _ticket.description ?? '';
    _priceController.text = _ticket.price?.toString() ?? '0';
    _capacityController.text = _ticket.capacity.toString();
    _minQuantityController.text = _ticket.minQuantity.toString();
    _maxQuantityController.text = _ticket.maxQuantity.toString();
    _promoCodeController.text = _ticket.promoCode ?? '';
    _termsController.text = _ticket.termsConditions ?? '';
    _benefits = List.from(_ticket.benefits);
    
    // Add listeners for live preview update
    _nameController.addListener(_updateTicketPreview);
    _descriptionController.addListener(_updateTicketPreview);
    _priceController.addListener(_updateTicketPreview);
    _capacityController.addListener(_updateTicketPreview);
  }
  
  void _updateTicketPreview() {
    setState(() {
      _updateTicket();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _capacityController.dispose();
    _minQuantityController.dispose();
    _maxQuantityController.dispose();
    _promoCodeController.dispose();
    _termsController.dispose();
    _benefitController.dispose();
    super.dispose();
  }

  void _updateTicket() {
    _ticket = _ticket.copyWith(
      name: _nameController.text,
      description: _descriptionController.text,
      price: _ticket.isFree ? 0 : double.tryParse(_priceController.text) ?? 0,
      capacity: int.tryParse(_capacityController.text) ?? 100,
      minQuantity: int.tryParse(_minQuantityController.text) ?? 1,
      maxQuantity: int.tryParse(_maxQuantityController.text) ?? 10,
      promoCode: _promoCodeController.text.isEmpty ? null : _promoCodeController.text,
      termsConditions: _termsController.text.isEmpty ? null : _termsController.text,
      benefits: _benefits,
    );
  }

  void _saveTicket() {
    if (_formKey.currentState?.validate() ?? false) {
      _updateTicket();
      widget.onTicketCreated(_ticket);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(widget.initialTicket == null ? 'Create Custom Ticket' : 'Edit Ticket'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: widget.onCancel ?? () => Navigator.pop(context),
          icon: const Icon(Icons.close),
        ),
        actions: [
          TextButton(
            onPressed: _saveTicket,
            child: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Basic Info'),
            Tab(text: 'Pricing'),
            Tab(text: 'Benefits'),
            Tab(text: 'Advanced'),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            // Live Preview
            _buildLivePreview(),
            
            // Tab Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildBasicInfoTab(),
                  _buildPricingTab(),
                  _buildBenefitsTab(),
                  _buildAdvancedTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLivePreview() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Live Preview',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          _buildTicketPreviewCard(),
        ],
      ),
    );
  }

  Widget _buildTicketPreviewCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            _ticket.colorValue,
            _ticket.colorValue.withOpacity(0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: _ticket.colorValue.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _ticket.iconData,
                color: Colors.white,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _ticket.name.isEmpty ? 'Ticket Name' : _ticket.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if (_ticket.badgeText != null && _ticket.badgeText!.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _ticket.badgeText!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          
          if (_ticket.description != null && _ticket.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              _ticket.description!,
              style: TextStyle(
                color: Colors.white.withOpacity(0.9),
                fontSize: 14,
              ),
            ),
          ],
          
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Price',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      _ticket.formattedPrice,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Available',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      '${_ticket.remainingCapacity}/${_ticket.capacity}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBasicInfoTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ticket Templates
          _buildTemplateSelector(),
          
          const SizedBox(height: 24),
          
          // Ticket Name
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Ticket Name *',
              hintText: 'e.g., Early Bird Special, Student Package',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter ticket name';
              }
              return null;
            },
            onChanged: (value) => setState(() {}),
          ),
          
          const SizedBox(height: 16),
          
          // Description
          TextFormField(
            controller: _descriptionController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Description',
              hintText: 'Describe what this ticket includes...',
              border: OutlineInputBorder(),
            ),
            onChanged: (value) => setState(() {}),
          ),
          
          const SizedBox(height: 16),
          
          // Capacity
          TextFormField(
            controller: _capacityController,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(
              labelText: 'Capacity *',
              hintText: 'Maximum number of tickets',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter capacity';
              }
              final capacity = int.tryParse(value);
              if (capacity == null || capacity <= 0) {
                return 'Please enter valid capacity';
              }
              return null;
            },
            onChanged: (value) => setState(() {}),
          ),
          
          const SizedBox(height: 24),
          
          // Visual Customization
          _buildVisualCustomization(),
        ],
      ),
    );
  }

  Widget _buildTemplateSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Templates',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Start with a template or create from scratch',
          style: TextStyle(
            color: Colors.grey,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: TicketTemplates.templates.length,
            itemBuilder: (context, index) {
              final template = TicketTemplates.templates[index];
              return Container(
                width: 200,
                margin: const EdgeInsets.only(right: 12),
                child: _buildTemplateCard(template),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTemplateCard(Map<String, dynamic> template) {
    final color = Color(int.parse(template['color'].replaceFirst('#', '0xFF')));
    
    return GestureDetector(
      onTap: () => _applyTemplate(template),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [color, color.withOpacity(0.8)],
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getIconFromString(template['icon']),
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    template['name'],
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              template['description'],
              style: TextStyle(
                color: Colors.white.withOpacity(0.9),
                fontSize: 12,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            Text(
              '${(template['benefits'] as List).length} benefits',
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _applyTemplate(Map<String, dynamic> template) {
    setState(() {
      _nameController.text = template['name'];
      _descriptionController.text = template['description'];
      _benefits = List<String>.from(template['benefits']);
      _ticket = _ticket.copyWith(
        name: template['name'],
        description: template['description'],
        color: template['color'],
        icon: template['icon'],
        badgeText: template['badgeText'],
        benefits: _benefits,
      );
    });
  }

  Widget _buildVisualCustomization() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Visual Customization',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        
        // Color Picker
        _buildColorPicker(),
        
        const SizedBox(height: 16),
        
        // Icon Picker
        _buildIconPicker(),
        
        const SizedBox(height: 16),
        
        // Badge Text
        TextFormField(
          initialValue: _ticket.badgeText,
          decoration: const InputDecoration(
            labelText: 'Badge Text (Optional)',
            hintText: 'e.g., EARLY, VIP, LIMITED',
            border: OutlineInputBorder(),
          ),
          onChanged: (value) {
            setState(() {
              _ticket = _ticket.copyWith(
                badgeText: value.isEmpty ? null : value.toUpperCase(),
              );
            });
          },
        ),
      ],
    );
  }

  Widget _buildColorPicker() {
    final colors = [
      '#2563EB', '#10B981', '#F59E0B', '#EF4444',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
      '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Color Theme'),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: colors.map((colorHex) {
            final color = Color(int.parse(colorHex.replaceFirst('#', '0xFF')));
            final isSelected = _ticket.color == colorHex;
            
            return GestureDetector(
              onTap: () {
                setState(() {
                  _ticket = _ticket.copyWith(color: colorHex);
                });
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  border: isSelected 
                      ? Border.all(color: Colors.black, width: 3)
                      : null,
                ),
                child: isSelected 
                    ? const Icon(Icons.check, color: Colors.white)
                    : null,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildIconPicker() {
    final icons = [
      {'name': 'ticket', 'icon': Icons.confirmation_number},
      {'name': 'star', 'icon': Icons.star},
      {'name': 'crown', 'icon': Icons.workspace_premium},
      {'name': 'diamond', 'icon': Icons.diamond},
      {'name': 'heart', 'icon': Icons.favorite},
      {'name': 'fire', 'icon': Icons.local_fire_department},
      {'name': 'flash', 'icon': Icons.flash_on},
      {'name': 'gift', 'icon': Icons.card_giftcard},
      {'name': 'student', 'icon': Icons.school},
      {'name': 'group', 'icon': Icons.group},
      {'name': 'early', 'icon': Icons.access_time},
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Icon'),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: icons.map((iconData) {
            final isSelected = _ticket.icon == iconData['name'];
            
            return GestureDetector(
              onTap: () {
                setState(() {
                  _ticket = _ticket.copyWith(icon: iconData['name'] as String);
                });
              },
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isSelected ? _ticket.colorValue : Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  iconData['icon'] as IconData,
                  color: isSelected ? Colors.white : Colors.grey[600],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPricingTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Free/Paid Toggle
          SwitchListTile(
            title: const Text('Free Ticket'),
            subtitle: const Text('No payment required'),
            value: _ticket.isFree,
            onChanged: (value) {
              setState(() {
                _ticket = _ticket.copyWith(isFree: value);
                if (value) {
                  _priceController.text = '0';
                }
              });
            },
          ),
          
          if (!_ticket.isFree) ...[
            const SizedBox(height: 16),
            
            // Price
            TextFormField(
              controller: _priceController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Price (IDR) *',
                hintText: 'Enter ticket price',
                border: OutlineInputBorder(),
                prefixText: 'Rp ',
              ),
              validator: (value) {
                if (!_ticket.isFree && (value == null || value.isEmpty)) {
                  return 'Please enter price';
                }
                return null;
              },
              onChanged: (value) => setState(() {}),
            ),
            
            const SizedBox(height: 16),
            
            // Discount Section
            _buildDiscountSection(),
          ],
          
          const SizedBox(height: 24),
          
          // Sale Period
          _buildSalePeriodSection(),
          
          const SizedBox(height: 24),
          
          // Quantity Limits
          _buildQuantityLimitsSection(),
        ],
      ),
    );
  }

  Widget _buildDiscountSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Discount & Promotion',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        
        // Original Price
        TextFormField(
          initialValue: _ticket.originalPrice?.toString(),
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Original Price (Optional)',
            hintText: 'Show crossed-out original price',
            border: OutlineInputBorder(),
            prefixText: 'Rp ',
          ),
          onChanged: (value) {
            setState(() {
              _ticket = _ticket.copyWith(
                originalPrice: value.isEmpty ? null : double.tryParse(value),
              );
            });
          },
        ),
        
        const SizedBox(height: 16),
        
        // Discount Percentage
        TextFormField(
          initialValue: _ticket.discountPercentage?.toString(),
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Discount Percentage',
            hintText: 'e.g., 20 for 20% off',
            border: OutlineInputBorder(),
            suffixText: '%',
          ),
          onChanged: (value) {
            setState(() {
              _ticket = _ticket.copyWith(
                discountPercentage: value.isEmpty ? null : double.tryParse(value),
              );
            });
          },
        ),
        
        const SizedBox(height: 16),
        
        // Promo Code
        TextFormField(
          controller: _promoCodeController,
          decoration: const InputDecoration(
            labelText: 'Promo Code (Optional)',
            hintText: 'e.g., EARLY2024, STUDENT50',
            border: OutlineInputBorder(),
          ),
        ),
      ],
    );
  }

  Widget _buildSalePeriodSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Sale Period',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        
        Row(
          children: [
            Expanded(
              child: _buildDateTimePicker(
                label: 'Sale Start',
                value: _ticket.saleStartDate,
                onChanged: (date) {
                  setState(() {
                    _ticket = _ticket.copyWith(saleStartDate: date);
                  });
                },
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildDateTimePicker(
                label: 'Sale End',
                value: _ticket.saleEndDate,
                onChanged: (date) {
                  setState(() {
                    _ticket = _ticket.copyWith(saleEndDate: date);
                  });
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuantityLimitsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Purchase Limits',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _minQuantityController,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(
                  labelText: 'Min Quantity',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _maxQuantityController,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(
                  labelText: 'Max Quantity',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBenefitsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ticket Benefits',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'What does this ticket include? Add benefits to help customers understand the value.',
            style: TextStyle(
              color: Colors.grey,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          
          // Add Benefit Input
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _benefitController,
                  decoration: const InputDecoration(
                    hintText: 'e.g., Welcome drink, Certificate, Priority seating',
                    border: OutlineInputBorder(),
                  ),
                  onFieldSubmitted: _addBenefit,
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: () => _addBenefit(_benefitController.text),
                icon: const Icon(Icons.add_circle),
                color: Theme.of(context).primaryColor,
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Benefits List
          if (_benefits.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.card_giftcard_outlined,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No benefits added yet',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add benefits to make your ticket more attractive',
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            Column(
              children: _benefits.asMap().entries.map((entry) {
                final index = entry.key;
                final benefit = entry.value;
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: _ticket.colorValue,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          benefit,
                          style: const TextStyle(fontSize: 16),
                        ),
                      ),
                      IconButton(
                        onPressed: () => _removeBenefit(index),
                        icon: const Icon(Icons.remove_circle_outline),
                        color: Colors.red,
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          
          const SizedBox(height: 24),
          
          // Suggested Benefits
          _buildSuggestedBenefits(),
        ],
      ),
    );
  }

  Widget _buildSuggestedBenefits() {
    final suggestions = [
      'Event access',
      'Certificate of attendance',
      'Welcome kit',
      'Lunch included',
      'Coffee break',
      'Networking session',
      'Priority seating',
      'VIP lounge access',
      'Meet & greet with speakers',
      'Recording access',
      'Digital materials',
      'Parking included',
      'Welcome drink',
      'Goodie bag',
      'Photo session',
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Suggested Benefits',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: suggestions.map((suggestion) {
            final isAdded = _benefits.contains(suggestion);
            
            return GestureDetector(
              onTap: isAdded ? null : () => _addBenefit(suggestion),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isAdded ? Colors.grey[300] : _ticket.colorValue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isAdded ? Colors.grey[400]! : _ticket.colorValue,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isAdded)
                      Icon(
                        Icons.check,
                        size: 16,
                        color: Colors.grey[600],
                      )
                    else
                      Icon(
                        Icons.add,
                        size: 16,
                        color: _ticket.colorValue,
                      ),
                    const SizedBox(width: 4),
                    Text(
                      suggestion,
                      style: TextStyle(
                        color: isAdded ? Colors.grey[600] : _ticket.colorValue,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildAdvancedTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Approval Required
          SwitchListTile(
            title: const Text('Requires Approval'),
            subtitle: const Text('Manually approve each registration'),
            value: _ticket.requiresApproval,
            onChanged: (value) {
              setState(() {
                _ticket = _ticket.copyWith(requiresApproval: value);
              });
            },
          ),
          
          const SizedBox(height: 24),
          
          // Terms & Conditions
          TextFormField(
            controller: _termsController,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Terms & Conditions (Optional)',
              hintText: 'Special terms for this ticket type...',
              border: OutlineInputBorder(),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Active Status
          SwitchListTile(
            title: const Text('Active'),
            subtitle: const Text('Available for purchase'),
            value: _ticket.isActive,
            onChanged: (value) {
              setState(() {
                _ticket = _ticket.copyWith(isActive: value);
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDateTimePicker({
    required String label,
    DateTime? value,
    required Function(DateTime?) onChanged,
  }) {
    return InkWell(
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: value ?? DateTime.now(),
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        
        if (date != null) {
          final time = await showTimePicker(
            context: context,
            initialTime: TimeOfDay.fromDateTime(value ?? DateTime.now()),
          );
          
          if (time != null) {
            final dateTime = DateTime(
              date.year,
              date.month,
              date.day,
              time.hour,
              time.minute,
            );
            onChanged(dateTime);
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[400]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value != null
                  ? '${value.day}/${value.month}/${value.year} ${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}'
                  : 'Select date & time',
              style: TextStyle(
                fontSize: 16,
                color: value != null ? Colors.black : Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _addBenefit(String benefit) {
    if (benefit.trim().isNotEmpty && !_benefits.contains(benefit.trim())) {
      setState(() {
        _benefits.add(benefit.trim());
        _benefitController.clear();
      });
    }
  }

  void _removeBenefit(int index) {
    setState(() {
      _benefits.removeAt(index);
    });
  }

  IconData _getIconFromString(String iconName) {
    switch (iconName.toLowerCase()) {
      case 'star': return Icons.star;
      case 'crown': return Icons.workspace_premium;
      case 'diamond': return Icons.diamond;
      case 'heart': return Icons.favorite;
      case 'fire': return Icons.local_fire_department;
      case 'flash': return Icons.flash_on;
      case 'gift': return Icons.card_giftcard;
      case 'student': return Icons.school;
      case 'group': return Icons.group;
      case 'early': return Icons.access_time;
      default: return Icons.confirmation_number;
    }
  }
}