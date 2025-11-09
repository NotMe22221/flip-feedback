import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { ArrowLeft, Download, ExternalLink, Loader2, Receipt } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  type: 'invoice' | 'payment';
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
}

export default function BillingHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('billing-history');

      if (error) throw error;

      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching billing history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      paid: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
      succeeded: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
      open: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
      draft: 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30',
      void: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
      uncollectible: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
    };

    return (
      <Badge variant="outline" className={statusColors[status] || ''}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navigation />

      <main className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/app')}
              className="mb-4 hover:bg-primary/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Billing History
                </h1>
                <p className="text-muted-foreground mt-1">
                  View your past payments and download invoices
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All your payments, invoices, and subscription charges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground">
                    Your billing history will appear here once you make a payment
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.type === 'invoice' ? 'Subscription' : 'Payment'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.currency} ${transaction.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="text-right">
                            {transaction.type === 'invoice' && (
                              <div className="flex gap-2 justify-end">
                                {transaction.invoicePdf && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(transaction.invoicePdf, '_blank')}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    PDF
                                  </Button>
                                )}
                                {transaction.hostedInvoiceUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(transaction.hostedInvoiceUrl, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
