import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/ticket.dart';

class TicketCard extends StatelessWidget {
  final Ticket ticket;
  final VoidCallback onTap;
  final VoidCallback onDownload;

  const TicketCard({
    super.key,
    required this.ticket,
    required this.onTap,
    required this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    // 📱 CACHE MEDIAQUERY DATA (Reddit insight: MediaQuery.sizeOf > MediaQuery.of)
    final screenSize = MediaQuery.sizeOf(context);
    final screenWidth = screenSize.width;
    final cardHeight = screenWidth < 400 ? 240.0 : 220.0; // Increased height further
    final padding = screenWidth < 400 ? 16.0 : 14.0; // Reduced padding to save space
    
    // Get ticket type color, default to blue
    final ticketColor = ticket.ticketTypeColor;
    
    return Container(
      height: cardHeight,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 16,
            offset: const Offset(0, 6),
            spreadRadius: 0,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: () => context.push('/tickets/detail/${ticket.id}', extra: ticket),
          child: Row(
            children: [
              // Left section - Dynamic color based on ticket type
              Expanded(
                flex: 1,
                child: Container(
                  decoration: BoxDecoration(
                    color: ticketColor,
                  ),
                  padding: EdgeInsets.all(padding), // Responsive padding
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Top section - Location
                      Row(
                        children: [
                          Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(7),
                            ),
                            child: const Icon(
                              Icons.location_on,
                              color: Colors.white,
                              size: 12,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              ticket.event.location,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      
                      // Middle section - Time
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Time',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 2), // Further reduced spacing
                          Text(
                            ticket.event.formattedEventTime,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      
                      // Bottom section - Booking ID & Price (Responsive)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Booking ID
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Booking ID',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Text(
                                ticket.registrationToken.toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8), // Reduced spacing between sections
                          // Ticket Type & Price (moved below Booking ID)
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Ticket Type Name
                              if (ticket.ticketType != null && ticket.ticketType!.name.isNotEmpty)
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Ticket Type',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    Text(
                                      ticket.ticketType!.name,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                  ],
                                ),
                              // Price
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Price',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Text(
                                    ticket.displayPrice,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              
              
              // Right section - White background with date
              Expanded(
                flex: 1,
                child: Container(
                  color: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: padding, vertical: padding), // Reduced vertical padding
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Month
                      Text(
                        _getMonthAbbreviation(_parseEventDate(ticket.event.eventDate)),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Day - Use ticket type color
                      Text(
                        _getDay(_parseEventDate(ticket.event.eventDate)),
                        style: TextStyle(
                          color: ticketColor,
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          height: 1.0,
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Year
                      Text(
                        _getYear(_parseEventDate(ticket.event.eventDate)),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  DateTime _parseEventDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) {
      return DateTime.now();
    }
    try {
      return DateTime.parse(dateString);
    } catch (e) {
      return DateTime.now();
    }
  }

  String _getMonthAbbreviation(DateTime date) {
    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    return months[date.month - 1];
  }

  String _getDay(DateTime date) {
    return date.day.toString().padLeft(2, '0');
  }

  String _getYear(DateTime date) {
    return date.year.toString();
  }
}

