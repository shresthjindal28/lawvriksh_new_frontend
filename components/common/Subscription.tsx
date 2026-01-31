'use client';
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { plans } from '@/lib/constants/subscription';
import SubscriptionCard from '../ui/SubscriptionCard';
import FeedbackDialog from '../ui/feedbackDialog';
import { useToast } from '@/lib/contexts/ToastContext';
import { workspaceService } from '@/lib/api/workSpaceService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MobileHeader } from '@/components/common/MobileHeader';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 50,
      damping: 15,
    },
  },
};

export default function SubscriptionComponent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { profile } = useAuth();

  const handleSendFeedback = useCallback(
    async (plan: any) => {
      try {
        setLoading(true);
        if (!profile?.user_id) {
          addToast('User not found', 'error');
          return;
        }
        const response = await workspaceService.sendSubscriptionFeedback({
          user_id: profile?.user_id,
          subscription_type: plan.name,
        });
        if (response.success) {
          setIsDialogOpen(true);
          addToast('Feedback sent successfully', 'success');
        }
      } catch (error) {
        addToast('Failed to send feedback', 'error');
      } finally {
        setLoading(false);
      }
    },
    [addToast, profile?.user_id]
  );

  return (
    <>
      <MobileHeader />
      <main className="subscription-page">
        <div className="subscription-container">
          <motion.header
            className="subscription-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>Help Shape Our Pricing</h1>
            <p>
              We're validating our pricing model. Show us which plan works for you—no payment
              required.
            </p>
          </motion.header>

          <motion.div
            className="subscription-cards"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={itemVariants}>
                <SubscriptionCard {...plan} onClick={() => handleSendFeedback(plan)} />
              </motion.div>
            ))}
          </motion.div>
        </div>
        <FeedbackDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          icon="✓"
          title="Thanks for your feedback!"
          subtitle="You've shown interest in Pro Plan"
          steps={[
            { text: "We'll email you when we launch (no spam, promise)" },
            { text: 'Get [15% launch discount]' },
            { text: 'Takes 30 seconds: Tell us more about your needs [Go to Survey]' },
          ]}
        />
      </main>
    </>
  );
}
