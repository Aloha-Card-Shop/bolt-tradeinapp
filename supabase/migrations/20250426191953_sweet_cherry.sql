/*
  # Add trade-in status and handling

  1. Changes
    - Add status column to trade_ins table
    - Add handled_by column to track which staff member handled the trade-in
    - Add handled_at timestamp to track when the trade-in was processed
    - Add notes column for staff comments
    - Add RLS policies for admin/manager access

  2. Security
    - Enable RLS policies for admin and manager roles
    - Managers and admins can view and update trade-ins
    - Regular users can only view their own trade-ins
*/

-- Add new columns to trade_ins table
ALTER TABLE trade_ins
ADD COLUMN status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'accepted', 'rejected')),
ADD COLUMN handled_by uuid REFERENCES auth.users(id),
ADD COLUMN handled_at timestamptz,
ADD COLUMN staff_notes text;

-- Create index for status column
CREATE INDEX idx_trade_ins_status ON trade_ins(status);

-- Create index for handled_by
CREATE INDEX idx_trade_ins_handled_by ON trade_ins(handled_by);

-- Update RLS policies
CREATE POLICY "Enable read access for admin and managers"
ON trade_ins
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'manager')
  OR customer_id IN (
    SELECT id FROM customers 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Enable update for admin and managers"
ON trade_ins
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'manager')
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text IN ('admin', 'manager')
);