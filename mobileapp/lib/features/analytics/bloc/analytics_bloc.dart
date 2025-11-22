import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../models/analytics_models.dart' as analytics_models;
import '../services/analytics_service.dart';

// Events
abstract class AnalyticsEvent extends Equatable {
  const AnalyticsEvent();

  @override
  List<Object?> get props => [];
}

class LoadAnalyticsData extends AnalyticsEvent {
  final analytics_models.AnalyticsFilters filters;

  const LoadAnalyticsData({required this.filters});

  @override
  List<Object?> get props => [filters];
}

class UpdateAnalyticsFilters extends AnalyticsEvent {
  final analytics_models.AnalyticsFilters filters;

  const UpdateAnalyticsFilters({required this.filters});

  @override
  List<Object?> get props => [filters];
}

class RefreshAnalyticsData extends AnalyticsEvent {
  const RefreshAnalyticsData();
}

// States
abstract class AnalyticsState extends Equatable {
  const AnalyticsState();

  @override
  List<Object?> get props => [];
}

class AnalyticsInitial extends AnalyticsState {}

class AnalyticsLoading extends AnalyticsState {}

class AnalyticsDataLoaded extends AnalyticsState {
  final analytics_models.AnalyticsData analyticsData;
  final analytics_models.AnalyticsFilters filters;
  final List<analytics_models.AnalyticsEvent> filteredEvents;

  const AnalyticsDataLoaded({
    required this.analyticsData,
    required this.filters,
    required this.filteredEvents,
  });

  @override
  List<Object?> get props => [analyticsData, filters, filteredEvents];
}

class AnalyticsFailure extends AnalyticsState {
  final String message;
  final String? details;

  const AnalyticsFailure({required this.message, this.details});

  @override
  List<Object?> get props => [message, details];
}

// BLoC
class AnalyticsBloc extends Bloc<AnalyticsEvent, AnalyticsState> {
  final AnalyticsService _analyticsService = AnalyticsService();

  AnalyticsBloc() : super(AnalyticsInitial()) {
    on<LoadAnalyticsData>(_onLoadAnalyticsData);
    on<UpdateAnalyticsFilters>(_onUpdateAnalyticsFilters);
    on<RefreshAnalyticsData>(_onRefreshAnalyticsData);
  }

  Future<void> _onLoadAnalyticsData(
    LoadAnalyticsData event,
    Emitter<AnalyticsState> emit,
  ) async {
    emit(AnalyticsLoading());
    try {
      final result = await _analyticsService.getAnalyticsData(
        search: event.filters.searchQuery.isNotEmpty ? event.filters.searchQuery : null,
        category: event.filters.categoryFilter != 'all' ? event.filters.categoryFilter : null,
        status: event.filters.statusFilter != 'all' ? event.filters.statusFilter : null,
        sortBy: event.filters.sortBy,
        sortOrder: event.filters.sortOrder,
      );

      if (result['success'] == true) {
        final analyticsData = result['analyticsData'] as analytics_models.AnalyticsData;
        final filteredEvents = _analyticsService.filterEvents(
          analyticsData.events,
          event.filters,
        );

        emit(AnalyticsDataLoaded(
          analyticsData: analyticsData,
          filters: event.filters,
          filteredEvents: filteredEvents,
        ));
      } else {
        emit(AnalyticsFailure(message: result['message']));
      }
    } catch (e) {
      emit(AnalyticsFailure(message: 'Failed to load analytics data: $e'));
    }
  }

  Future<void> _onUpdateAnalyticsFilters(
    UpdateAnalyticsFilters event,
    Emitter<AnalyticsState> emit,
  ) async {
    if (state is AnalyticsDataLoaded) {
      final currentState = state as AnalyticsDataLoaded;
      final filteredEvents = _analyticsService.filterEvents(
        currentState.analyticsData.events,
        event.filters,
      );

      emit(AnalyticsDataLoaded(
        analyticsData: currentState.analyticsData,
        filters: event.filters,
        filteredEvents: filteredEvents,
      ));
    }
  }

  Future<void> _onRefreshAnalyticsData(
    RefreshAnalyticsData event,
    Emitter<AnalyticsState> emit,
  ) async {
    if (state is AnalyticsDataLoaded) {
      final currentState = state as AnalyticsDataLoaded;
      add(LoadAnalyticsData(filters: currentState.filters));
    } else {
      add(const LoadAnalyticsData(filters: analytics_models.AnalyticsFilters()));
    }
  }
}
