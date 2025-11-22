import 'package:flutter/material.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/models/ticket_type_model.dart';
import '../../../features/organizer/services/ticket_type_service.dart';

class EventDetailTicketsTab extends StatefulWidget {
  final EventModel event;
  final Function(TicketType, int)? onTicketSelected;

  const EventDetailTicketsTab({
    super.key,
    required this.event,
    this.onTicketSelected,
  });

  @override
  State<EventDetailTicketsTab> createState() => _EventDetailTicketsTabState();
}

class _EventDetailTicketsTabState extends State<EventDetailTicketsTab> {
  final TicketTypeService _ticketTypeService = TicketTypeService();
  List<TicketType> _ticketTypes = [];
  bool _isLoading = true;
  String? _error;
  TicketType? _selectedTicket;
  String? _expandedTicketId;
  Map<String, int> _quantities = {};

  @override
  void initState() {
    super.initState();
    _loadTicketTypes();
  }

  Future<void> _loadTicketTypes() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final ticketTypes = await _ticketTypeService.getEventTicketTypes(
        widget.event.id,
        includeInactive: false,
      );

      setState(() {
        _ticketTypes = ticketTypes;
        // Initialize default quantities for each ticket type
        _quantities = {for (var t in ticketTypes) t.id: 1};
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
              const SizedBox(height: 16),
              Text(
                'Failed to load tickets',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadTicketTypes,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_ticketTypes.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.confirmation_number_outlined,
                size: 64,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                'No Tickets Available',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'This event doesn\'t have any ticket types yet',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: 120, // Extra bottom padding for floating button
      ),
      itemCount: _ticketTypes.length,
      itemBuilder: (context, index) {
        final ticket = _ticketTypes[index];
        final isSelected = _selectedTicket?.id == ticket.id;
        
        return _buildTicketCard(ticket, isSelected);
      },
    );
  }

  Widget _buildTicketCard(TicketType ticket, bool isSelected) {
    final bool isAvailable = ticket.isAvailable && ticket.isSaleActive;
    final bool isSoldOut = ticket.isSoldOut;
    final bool isExpanded = _expandedTicketId == ticket.id;

    return GestureDetector(
      onTap: () {
        setState(() {
          // Toggle expand
          if (_expandedTicketId == ticket.id) {
            _expandedTicketId = null;
          } else {
            _expandedTicketId = ticket.id;
          }
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: ticket.colorValue,
          borderRadius: BorderRadius.circular(16),
          border: isSelected
              ? Border.all(color: Colors.white, width: 3)
              : null,
          boxShadow: [
            BoxShadow(
              color: ticket.colorValue.withOpacity(isSelected ? 0.5 : 0.3),
              blurRadius: isSelected ? 16 : 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with Icon and Title
              Row(
                children: [
                  Icon(
                    ticket.iconData,
                    color: Colors.white,
                    size: 24,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      ticket.name,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  // Expand/Collapse Icon
                  Icon(
                    isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    color: Colors.white,
                    size: 24,
                  ),
                ],
              ),
              
              // Description
              if (ticket.description != null) ...[
                const SizedBox(height: 6),
                Text(
                  ticket.description!,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.9),
                  ),
                  maxLines: isExpanded ? null : 2,
                  overflow: isExpanded ? null : TextOverflow.ellipsis,
                ),
              ],
              
              const SizedBox(height: 12),
              
              // Price and Available Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Price',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.white.withOpacity(0.8),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        ticket.formattedPrice,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Available',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.white.withOpacity(0.8),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        isSoldOut
                            ? 'Sold Out'
                            : '${ticket.remainingCapacity}/${ticket.capacity}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              
              // Expanded Content - Benefits
              if (isExpanded && ticket.benefits.isNotEmpty) ...[
                const SizedBox(height: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'What\'s Included:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                    const SizedBox(height: 10),
                    ...ticket.benefits.map((benefit) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.check_circle,
                            size: 16,
                            color: Colors.white.withOpacity(0.9),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              benefit,
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.white.withOpacity(0.9),
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
                  ],
                ),
              ],
              
              // Select Button (only show when expanded and available)
              if (isExpanded && isAvailable && widget.onTicketSelected != null) ...[
                const SizedBox(height: 14),
                // Quantity picker
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      onPressed: () {
                        final current = _quantities[ticket.id] ?? 1;
                        if (current > 1) {
                          setState(() {
                            _quantities[ticket.id] = current - 1;
                          });
                        }
                      },
                      icon: Icon(Icons.remove_circle_outline, color: Colors.white),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_quantities[ticket.id] ?? 1}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: () {
                        final current = _quantities[ticket.id] ?? 1;
                        final max = ticket.remainingCapacity ?? ticket.capacity ?? current;
                        if (current < max) {
                          setState(() {
                            _quantities[ticket.id] = current + 1;
                          });
                        }
                      },
                      icon: Icon(Icons.add_circle_outline, color: Colors.white),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _selectedTicket = ticket;
                      });
                      final qty = _quantities[ticket.id] ?? 1;
                      widget.onTicketSelected!(ticket, qty);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: ticket.colorValue,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      isSelected ? 'Selected ✓' : 'Buy ${_quantities[ticket.id] ?? 1} Ticket${(_quantities[ticket.id] ?? 1) > 1 ? 's' : ''}',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
