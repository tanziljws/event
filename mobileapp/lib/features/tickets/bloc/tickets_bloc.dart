import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../models/ticket.dart';
import '../services/tickets_service.dart';

// Events
abstract class TicketsEvent extends Equatable {
  const TicketsEvent();

  @override
  List<Object?> get props => [];
}

class LoadTickets extends TicketsEvent {
  final int page;
  final int limit;
  final String? status;
  final String? search;
  final bool refresh;

  const LoadTickets({
    this.page = 1,
    this.limit = 10,
    this.status,
    this.search,
    this.refresh = false,
  });

  @override
  List<Object?> get props => [page, limit, status, search, refresh];
}

class LoadMoreTickets extends TicketsEvent {
  const LoadMoreTickets();
}

class RefreshTickets extends TicketsEvent {
  const RefreshTickets();
}

class FilterTickets extends TicketsEvent {
  final String? status;
  final String? search;

  const FilterTickets({this.status, this.search});

  @override
  List<Object?> get props => [status, search];
}

class LoadTicketDetails extends TicketsEvent {
  final String registrationId;

  const LoadTicketDetails(this.registrationId);

  @override
  List<Object> get props => [registrationId];
}

class DownloadTicket extends TicketsEvent {
  final String registrationId;

  const DownloadTicket(this.registrationId);

  @override
  List<Object> get props => [registrationId];
}


// States
abstract class TicketsState extends Equatable {
  const TicketsState();

  @override
  List<Object?> get props => [];
}

class TicketsInitial extends TicketsState {}

class TicketsLoading extends TicketsState {}

class TicketsLoaded extends TicketsState {
  final List<Ticket> tickets;
  final int currentPage;
  final int totalPages;
  final bool hasMore;
  final String? currentStatus;
  final String? currentSearch;
  final bool isLoadingMore;

  const TicketsLoaded({
    required this.tickets,
    required this.currentPage,
    required this.totalPages,
    required this.hasMore,
    this.currentStatus,
    this.currentSearch,
    this.isLoadingMore = false,
  });

  @override
  List<Object?> get props => [
        tickets,
        currentPage,
        totalPages,
        hasMore,
        currentStatus,
        currentSearch,
        isLoadingMore,
      ];

  TicketsLoaded copyWith({
    List<Ticket>? tickets,
    int? currentPage,
    int? totalPages,
    bool? hasMore,
    String? currentStatus,
    String? currentSearch,
    bool? isLoadingMore,
  }) {
    return TicketsLoaded(
      tickets: tickets ?? this.tickets,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      hasMore: hasMore ?? this.hasMore,
      currentStatus: currentStatus ?? this.currentStatus,
      currentSearch: currentSearch ?? this.currentSearch,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }
}

class TicketsError extends TicketsState {
  final String message;

  const TicketsError(this.message);

  @override
  List<Object> get props => [message];
}

class TicketDetailsLoading extends TicketsState {}

class TicketDetailsLoaded extends TicketsState {
  final Ticket ticket;

  const TicketDetailsLoaded(this.ticket);

  @override
  List<Object> get props => [ticket];
}

class TicketDetailsError extends TicketsState {
  final String message;

  const TicketDetailsError(this.message);

  @override
  List<Object> get props => [message];
}

class TicketDownloading extends TicketsState {
  final String registrationId;

  const TicketDownloading(this.registrationId);

  @override
  List<Object> get props => [registrationId];
}

class TicketDownloaded extends TicketsState {
  final String downloadUrl;

  const TicketDownloaded(this.downloadUrl);

  @override
  List<Object> get props => [downloadUrl];
}

class TicketDownloadError extends TicketsState {
  final String message;

  const TicketDownloadError(this.message);

  @override
  List<Object> get props => [message];
}


// Bloc
class TicketsBloc extends Bloc<TicketsEvent, TicketsState> {
  final TicketsService _ticketsService = TicketsService();

  TicketsBloc() : super(TicketsInitial()) {
    on<LoadTickets>(_onLoadTickets);
    on<LoadMoreTickets>(_onLoadMoreTickets);
    on<RefreshTickets>(_onRefreshTickets);
    on<FilterTickets>(_onFilterTickets);
    on<LoadTicketDetails>(_onLoadTicketDetails);
    on<DownloadTicket>(_onDownloadTicket);
  }

  Future<void> _onLoadTickets(LoadTickets event, Emitter<TicketsState> emit) async {
    if (event.refresh) {
      emit(TicketsLoading());
    }

    try {
      final result = await _ticketsService.getMyTickets(
        page: event.page,
        limit: event.limit,
        status: event.status,
        search: event.search,
      );

      if (result['success'] == true) {
        final data = result['data'];
        final tickets = List<Ticket>.from(data['tickets']);
        final pagination = data['pagination'];

        emit(TicketsLoaded(
          tickets: tickets,
          currentPage: event.page,
          totalPages: pagination['pages'] ?? 1,
          hasMore: event.page < (pagination['pages'] ?? 1),
          currentStatus: event.status,
          currentSearch: event.search,
        ));
      } else {
        emit(TicketsError(result['message'] ?? 'Failed to load tickets'));
      }
    } catch (e) {
      emit(TicketsError('Error loading tickets: ${e.toString()}'));
    }
  }

  Future<void> _onLoadMoreTickets(LoadMoreTickets event, Emitter<TicketsState> emit) async {
    if (state is! TicketsLoaded) return;

    final currentState = state as TicketsLoaded;
    if (!currentState.hasMore || currentState.isLoadingMore) return;

    emit(currentState.copyWith(isLoadingMore: true));

    try {
      final result = await _ticketsService.getMyTickets(
        page: currentState.currentPage + 1,
        limit: 10,
        status: currentState.currentStatus,
        search: currentState.currentSearch,
      );

      if (result['success'] == true) {
        final data = result['data'];
        final newTickets = List<Ticket>.from(data['tickets']);
        final pagination = data['pagination'];

        emit(currentState.copyWith(
          tickets: [...currentState.tickets, ...newTickets],
          currentPage: currentState.currentPage + 1,
          totalPages: pagination['pages'] ?? 1,
          hasMore: (currentState.currentPage + 1) < (pagination['pages'] ?? 1),
          isLoadingMore: false,
        ));
      } else {
        emit(currentState.copyWith(isLoadingMore: false));
        emit(TicketsError(result['message'] ?? 'Failed to load more tickets'));
      }
    } catch (e) {
      emit(currentState.copyWith(isLoadingMore: false));
      emit(TicketsError('Error loading more tickets: ${e.toString()}'));
    }
  }

  Future<void> _onRefreshTickets(RefreshTickets event, Emitter<TicketsState> emit) async {
    add(const LoadTickets(refresh: true));
  }

  Future<void> _onFilterTickets(FilterTickets event, Emitter<TicketsState> emit) async {
    add(LoadTickets(
      status: event.status,
      search: event.search,
      refresh: true,
    ));
  }

  Future<void> _onLoadTicketDetails(LoadTicketDetails event, Emitter<TicketsState> emit) async {
    emit(TicketDetailsLoading());

    try {
      final result = await _ticketsService.getTicketByRegistration(event.registrationId);

      if (result['success'] == true) {
        emit(TicketDetailsLoaded(result['data']));
      } else {
        emit(TicketDetailsError(result['message'] ?? 'Failed to load ticket details'));
      }
    } catch (e) {
      emit(TicketDetailsError('Error loading ticket details: ${e.toString()}'));
    }
  }

  Future<void> _onDownloadTicket(DownloadTicket event, Emitter<TicketsState> emit) async {
    emit(TicketDownloading(event.registrationId));

    try {
      final result = await _ticketsService.getTicketDownloadUrl(event.registrationId);

      if (result['success'] == true) {
        final data = result['data'];
        emit(TicketDownloaded(data['downloadUrl'] ?? data['ticketUrl']));
      } else {
        emit(TicketDownloadError(result['message'] ?? 'Failed to get download URL'));
      }
    } catch (e) {
      emit(TicketDownloadError('Error downloading ticket: ${e.toString()}'));
    }
  }

}
