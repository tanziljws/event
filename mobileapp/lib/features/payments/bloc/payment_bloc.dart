import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../shared/services/payment_service.dart';

// Events
abstract class PaymentEvent extends Equatable {
  const PaymentEvent();
  
  @override
  List<Object?> get props => [];
}

class PaymentInitialize extends PaymentEvent {}

class PaymentCreateOrder extends PaymentEvent {
  final String eventId;
  final String eventTitle;
  final double amount;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  
  const PaymentCreateOrder({
    required this.eventId,
    required this.eventTitle,
    required this.amount,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
  });
  
  @override
  List<Object?> get props => [
    eventId,
    eventTitle,
    amount,
    customerName,
    customerEmail,
    customerPhone,
  ];
}

class PaymentProcess extends PaymentEvent {
  final String orderId;
  final double amount;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  
  const PaymentProcess({
    required this.orderId,
    required this.amount,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
  });
  
  @override
  List<Object?> get props => [
    orderId,
    amount,
    customerName,
    customerEmail,
    customerPhone,
  ];
}

class PaymentCheckStatus extends PaymentEvent {
  final String orderId;
  
  const PaymentCheckStatus({required this.orderId});
  
  @override
  List<Object?> get props => [orderId];
}

class PaymentGetHistory extends PaymentEvent {}

// States
abstract class PaymentState extends Equatable {
  const PaymentState();
  
  @override
  List<Object?> get props => [];
}

class PaymentInitial extends PaymentState {}

class PaymentLoading extends PaymentState {}

class PaymentOrderCreated extends PaymentState {
  final Map<String, dynamic> orderData;
  
  const PaymentOrderCreated({required this.orderData});
  
  @override
  List<Object?> get props => [orderData];
}

class PaymentProcessing extends PaymentState {}

class PaymentSuccess extends PaymentState {
  final Map<String, dynamic> result;
  
  const PaymentSuccess({required this.result});
  
  @override
  List<Object?> get props => [result];
}

class PaymentPending extends PaymentState {
  final Map<String, dynamic> result;
  
  const PaymentPending({required this.result});
  
  @override
  List<Object?> get props => [result];
}

class PaymentFailed extends PaymentState {
  final String error;
  
  const PaymentFailed({required this.error});
  
  @override
  List<Object?> get props => [error];
}

class PaymentHistoryLoaded extends PaymentState {
  final List<Map<String, dynamic>> payments;
  
  const PaymentHistoryLoaded({required this.payments});
  
  @override
  List<Object?> get props => [payments];
}

// Bloc
class PaymentBloc extends Bloc<PaymentEvent, PaymentState> {
  PaymentBloc() : super(PaymentInitial()) {
    on<PaymentInitialize>(_onInitialize);
    on<PaymentCreateOrder>(_onCreateOrder);
    on<PaymentProcess>(_onProcessPayment);
    on<PaymentCheckStatus>(_onCheckStatus);
    on<PaymentGetHistory>(_onGetHistory);
  }
  
  Future<void> _onInitialize(
    PaymentInitialize event,
    Emitter<PaymentState> emit,
  ) async {
    try {
      emit(PaymentLoading());
      await PaymentService.initializeMidtrans();
      emit(PaymentInitial());
    } catch (e) {
      emit(PaymentFailed(error: e.toString()));
    }
  }
  
  Future<void> _onCreateOrder(
    PaymentCreateOrder event,
    Emitter<PaymentState> emit,
  ) async {
    try {
      emit(PaymentLoading());
      final orderData = await PaymentService.createPaymentOrder(
        eventId: event.eventId,
        eventTitle: event.eventTitle,
        amount: event.amount,
        customerName: event.customerName,
        customerEmail: event.customerEmail,
        customerPhone: event.customerPhone,
      );
      emit(PaymentOrderCreated(orderData: orderData));
    } catch (e) {
      emit(PaymentFailed(error: e.toString()));
    }
  }
  
  Future<void> _onProcessPayment(
    PaymentProcess event,
    Emitter<PaymentState> emit,
  ) async {
    try {
      emit(PaymentProcessing());
      final result = await PaymentService.processPayment(
        orderId: event.orderId,
        amount: event.amount,
        customerName: event.customerName,
        customerEmail: event.customerEmail,
        customerPhone: event.customerPhone,
      );
      
      if (result['success'] == true) {
        emit(PaymentSuccess(result: result));
      } else {
        emit(PaymentFailed(error: 'Payment processing failed'));
      }
    } catch (e) {
      emit(PaymentFailed(error: e.toString()));
    }
  }
  
  Future<void> _onCheckStatus(
    PaymentCheckStatus event,
    Emitter<PaymentState> emit,
  ) async {
    try {
      emit(PaymentLoading());
      final status = await PaymentService.checkPaymentStatus(event.orderId);
      
      if (status['status'] == 'success') {
        emit(PaymentSuccess(result: status));
      } else if (status['status'] == 'pending') {
        emit(PaymentPending(result: status));
      } else {
        emit(PaymentFailed(error: 'Payment failed or cancelled'));
      }
    } catch (e) {
      emit(PaymentFailed(error: e.toString()));
    }
  }
  
  Future<void> _onGetHistory(
    PaymentGetHistory event,
    Emitter<PaymentState> emit,
  ) async {
    try {
      emit(PaymentLoading());
      final payments = await PaymentService.getPaymentHistory();
      emit(PaymentHistoryLoaded(payments: payments));
    } catch (e) {
      emit(PaymentFailed(error: e.toString()));
    }
  }
}
