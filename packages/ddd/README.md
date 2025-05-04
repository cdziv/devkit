English | [繁體中文](./README.zh-TW.md)

# Introduction

@cdziv/devkit-ddd helps you implement Domain-Driven Design (DDD) in your code, building applications with clear domain knowledge, readability, maintainability, and extensibility. It is framework- and ORM-agnostic, allowing you to use it in your application as needed.

> **Tip**: This document assumes you have a basic understanding of DDD. If you are unfamiliar with DDD or unsure whether to adopt it in your application, [Eric Evans’ _Domain-Driven Design_](https://www.domainlanguage.com/ddd/) is a great starting point.

## Quick Start

### Installation

```bash
npm install @cdziv/devkit-ddd
```

### Building a Card Game Example

In this quick start example, we’ll use the core features of this library to implement the logic of a simple poker card game in the application’s domain layer.

First, a player needs a username and a chip stack balance. We’ll design the username as a value object:

```ts
type UsernameValue = string;
class Username extends ValueObject<UsernameValue> {
  // Must implement value validation method
  validate(value: UsernameValue): ValidationResult {
    if (value.length < 3 || value.length > 30) {
      return false;
    }
    return true;
  }
}
```

Pass a valid value during instantiation and access it via the `value` property. If the provided value fails validation, an error will be thrown:

```ts
const username = new Username('john_lennon');

expect(username.value).toBe('john_lennon');

const invalidName = '';
expect(() => new Username(invalidName)).toThrow(ArgumentInvalidError);
```

Next, we’ll design the chip stack as a value object. Here, we use `ChipCount` as a property of `StackValue`, so `Stack` doesn’t need to worry about whether the property value is a positive integer, encapsulating that domain invariant logic in `ChipCount`. We also define some behaviors for them, using `evolve` to update their values:

```ts
type ChipCountValue = number;
class ChipCount extends ValueObject<ChipCountValue> {
  add(count: ChipCount): ChipCount {
    return this.evolve(this.value + count.value);
  }

  subtract(count: ChipCount): ChipCount {
    if (count.value > this.value) {
      throw new DddError('Not enough chips');
    }
    // Another usage of evolve
    return this.evolve((originalValue) => originalValue - count.value);
  }

  validate(value: ChipCountValue): ValidationResult {
    if (value < 0 || !Number.isInteger(value)) {
      return false;
    }
    return true;
  }
}

type StackValue = {
  balance: ChipCount;
  bet: ChipCount;
};
class Stack extends ValueObject<StackValue> {
  raise(count: ChipCount): Stack {
    if (this.value.balance.value < count.value) {
      throw new DddError('Not enough balance');
    }
    // Another usage of evolve
    return this.evolve((originalValue) => ({
      balance: originalValue.balance.subtract(count),
      bet: originalValue.bet.add(count),
    }));
  }

  win(count: ChipCount): Stack {
    // Another usage of evolve
    return this.evolve({
      balance: this.value.balance.add(count),
      bet: new ChipCount(0),
    });
  }

  pay(): Stack {
    // Another usage of evolve
    return this.evolve('bet', new ChipCount(0));
  }

  validate(value: StackValue): ValidationResult {
    if (
      !(value.balance instanceof ChipCount) ||
      !(value.bet instanceof ChipCount)
    ) {
      return false;
    }
    return true;
  }
}
```

Note that we design all domain objects as immutable, so `evolve` returns a new value object instead of modifying the existing one. This ensures that domain objects always adhere to domain invariants. The instantiation process calls the `validate` method, and as long as you successfully create the object—whether through creation, persistence restoration, or `evolve`—you must maintain its domain invariants, or an error should be thrown.

You can use the `equals` method to compare whether two value objects have the same value:

```ts
const chipCount = new ChipCount(100);
const updatedChipCount = chipCount.add(0);
expect(updatedChipCount).not.toBe(chipCount);
expect(updatedChipCount.equals(chipCount)).toBe(true);
```

Now, it’s time to design the player object. A player has a unique identifier and should be designed as an entity, not a value object. In a poker game, a player not only maintains domain invariants for internal state but also needs to perform actions like raising, calling, or waiting for external events to change internal state, acting like a gateway. Therefore, we design it as an aggregate root.

An aggregate root requires an ID:

```ts
class UUID extends EntityId<string> {
  // Must implement rawId getter
  get rawId(): string {
    return this.value;
  }

  // ... implementation details ...
}

type PlayerProps = {
  id: UUID;
  username: Username;
  stack: Stack;
  folded: boolean;
};
class Player extends AggregateRoot<PlayerProps, UUID> {
  // Must implement id getter
  get id(): UUID {
    return this.props.id;
  }

  validate(props: PlayerProps): ValidationResult {
    // ... implementation details ...
  }
}
```

In the game, a player’s actions must be received by other players to proceed with subsequent actions, so we need to define domain events:

```ts
class PlayerFolded extends DomainEvent {}
class PlayerChecked extends DomainEvent {}

type PlayerRaisedPayload = {
  amount: number;
};
class PlayerRaised extends DomainEvent<PlayerRaisedPayload> {
  constructor(aggregateId: string, amount: number) {
    super({
      aggregateId,
      amount,
    });
  }
}
```

Next, incorporate these into the player’s behaviors:

```ts
class Player extends AggregateRoot<PlayerProps, UUID> {
  // ... implementation details ...

  fold() {
    const event = new PlayerFolded(this.id.rawId);
    return this.evolve('folded', true).addEvent(event);
  }

  check() {
    const event = new PlayerChecked(this.id.rawId);
    return this.addEvent(event);
  }

  raise(count: ChipCount) {
    const event = new PlayerRaised(this.id.rawId);
    return this.evolve('stack', stack.raise(count)).addEvent(event);
  }

  // ... implementation details ...
}
```

When domain events are created alongside aggregate root behaviors and “actually occur”—e.g., after successful persistence—the aggregate root can publish the collected domain events to the event system:

```ts
const playerProps = {
  // ... implementation properties ...
};
let player = new Player(playerProps);

player = player.fold();

player.events; // [PlayerFolded]

// Persist state
await playerRepository.save(player);
// Publish domain events
player.publishEvents(eventEmitter);
```

## API Reference

TODO
